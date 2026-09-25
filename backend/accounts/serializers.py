import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

PHONE_RE = re.compile(r"^\+?[1-9]\d{7,14}$")


def normalize_phone(value: str) -> str:
    return re.sub(r"[\s()-]", "", value.strip())


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone",
            "full_name",
            "avatar",
            "user_type",
            "is_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "email",
            "phone",
            "user_type",
            "is_verified",
            "created_at",
            "updated_at",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    phone = serializers.CharField(required=True, max_length=20)
    user_type = serializers.ChoiceField(choices=(("customer", "Customer"), ("rider", "Rider")), default="customer")

    class Meta:
        model = User
        fields = ("email", "password", "full_name", "phone", "user_type")

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        value = normalize_phone(value)
        if not PHONE_RE.fullmatch(value):
            raise serializers.ValidationError("Enter a valid international phone number.")
        return value

    def validate(self, attrs):
        candidate = User(
            email=attrs.get("email"),
            phone=attrs.get("phone"),
            full_name=attrs.get("full_name", ""),
            user_type=attrs.get("user_type", "customer"),
        )
        validate_password(attrs["password"], user=candidate)
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"].strip(),
            phone=validated_data["phone"],
            user_type=validated_data.get("user_type", "customer"),
            is_verified=False,
        )
        if user.user_type == "rider":
            from riders.models import RiderProfile

            RiderProfile.objects.get_or_create(user=user, defaults={"verification_status": "pending"})
        return user


class OTPSendSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        value = normalize_phone(value)
        if not PHONE_RE.fullmatch(value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value


class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    otp = serializers.RegexField(r"^\d{6}$")

    def validate_phone(self, value):
        return normalize_phone(value)
