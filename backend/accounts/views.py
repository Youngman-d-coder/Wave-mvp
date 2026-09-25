import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPVerification
from .serializers import OTPVerifySerializer, OTPSendSerializer, RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


def _generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000:06d}"


def _store_otp(phone: str, code: str) -> None:
    verification, created = OTPVerification.objects.get_or_create(
        phone=phone,
        defaults={"otp_code": make_password(code), "is_verified": False},
    )
    if not created:
        verification.otp_code = make_password(code)
        verification.is_verified = False
        verification.created_at = timezone.now()
        verification.save(update_fields=["otp_code", "is_verified", "created_at"])


def send_otp(phone: str, code: str) -> bool:
    """Send an OTP through Twilio when configured; never log the raw code by default."""
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    from_number = getattr(settings, "TWILIO_FROM_NUMBER", "")

    if not (account_sid and auth_token and from_number):
        logger.info("OTP provider is not configured for %s", phone)
        return False

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
        client.messages.create(
            body=f"Your WAVE verification code is: {code}",
            from_=from_number,
            to=phone,
        )
        return True
    except Exception:
        logger.exception("Failed to send OTP to %s", phone)
        return False


def _issue_otp(phone: str) -> str:
    code = _generate_otp()
    _store_otp(phone, code)
    send_otp(phone, code)
    return code


def _maybe_attach_debug_otp(payload: dict, code: str) -> dict:
    if getattr(settings, "EXPOSE_OTP_FOR_TESTING", False):
        payload["debug_otp"] = code
    return payload


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp_code = _issue_otp(user.phone)

        response_data = UserSerializer(user).data
        _maybe_attach_debug_otp(response_data, otp_code)
        return Response(response_data, status=status.HTTP_201_CREATED)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"message": "Please provide both email and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active or not user.check_password(password):
            return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_verified:
            otp_code = _issue_otp(user.phone)
            response_data = {
                "message": "Phone number not verified. A new OTP has been sent.",
                "phone": user.phone,
            }
            _maybe_attach_debug_otp(response_data, otp_code)
            return Response(response_data, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        otp = serializer.validated_data["otp"]

        try:
            verification = OTPVerification.objects.get(phone=phone, is_verified=False)
        except OTPVerification.DoesNotExist:
            return Response(
                {"message": "No pending OTP verification found for this phone number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() - verification.created_at > timedelta(minutes=5):
            return Response({"message": "OTP code has expired"}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, verification.otp_code):
            return Response({"message": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST)

        verification.is_verified = True
        verification.save(update_fields=["is_verified"])
        User.objects.filter(phone=phone).update(is_verified=True)
        return Response({"message": "OTP verification successful"}, status=status.HTTP_200_OK)


class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            # Avoid making this endpoint an account-enumeration oracle.
            return Response({"message": "If the account exists, a new OTP has been sent."})

        if user.is_verified:
            return Response({"message": "This account is already verified"}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = _issue_otp(phone)
        response_data = {"message": "A new OTP has been sent"}
        _maybe_attach_debug_otp(response_data, otp_code)
        return Response(response_data, status=status.HTTP_200_OK)


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)


class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
