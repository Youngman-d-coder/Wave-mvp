import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPVerification
from .serializers import RegisterSerializer, UserSerializer, OTPSendSerializer, OTPVerifySerializer

User = get_user_model()

# Helper to send OTP (prints to console, sends SMS if twilio is installed and config is present)
def send_otp(phone, code):
    print(f"\n==========================================")
    print(f"🔑 WAVE SECURITY: Verification Code for {phone}")
    print(f"👉 YOUR OTP CODE IS: {code}")
    print(f"==========================================\n")
    
    # Check if twilio is configured
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')
    
    if account_sid and auth_token and from_number:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(
                body=f"Your WAVE verification code is: {code}",
                from_=from_number,
                to=phone
            )
            print(f"Twilio SMS sent to {phone}")
        except Exception as e:
            print(f"Failed to send Twilio SMS: {e}")

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate OTP
            otp_code = f"{random.randint(100000, 999999)}"
            OTPVerification.objects.update_or_create(
                phone=user.phone,
                defaults={'otp_code': otp_code, 'is_verified': False, 'created_at': timezone.now()}
            )
            
            # Send OTP
            if user.phone:
                send_otp(user.phone, otp_code)
                
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'message': 'Please provide both email and password'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.check_password(password):
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Ensure user is verified (Optional bypass for Admin/Demo accounts if desired)
        if not user.is_verified and user.user_type != 'admin':
            # Resend OTP if needed
            otp_code = f"{random.randint(100000, 999999)}"
            OTPVerification.objects.update_or_create(
                phone=user.phone,
                defaults={'otp_code': otp_code, 'is_verified': False, 'created_at': timezone.now()}
            )
            if user.phone:
                send_otp(user.phone, otp_code)
            return Response({'message': 'Phone number not verified. A new OTP has been sent.'}, status=status.HTTP_403_FORBIDDEN)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp = serializer.validated_data['otp']
            
            # Find the verification record
            try:
                verification = OTPVerification.objects.filter(phone=phone, is_verified=False).latest('created_at')
            except OTPVerification.DoesNotExist:
                return Response({'message': 'No pending OTP verification found for this phone number'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Check expiration (5 minutes)
            if timezone.now() - verification.created_at > timedelta(minutes=5):
                return Response({'message': 'OTP code has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
            if verification.otp_code == otp:
                verification.is_verified = True
                verification.save()
                
                # Mark user as verified
                try:
                    user = User.objects.get(phone=phone)
                    user.is_verified = True
                    user.save()
                except User.DoesNotExist:
                    pass
                    
                return Response({'message': 'OTP verification successful'}, status=status.HTTP_200_OK)
            return Response({'message': 'Invalid OTP code'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            
            # Generate new OTP
            otp_code = f"{random.randint(100000, 999999)}"
            OTPVerification.objects.update_or_create(
                phone=phone,
                defaults={'otp_code': otp_code, 'is_verified': False, 'created_at': timezone.now()}
            )
            
            send_otp(phone, otp_code)
            return Response({'message': 'OTP resent successfully'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
