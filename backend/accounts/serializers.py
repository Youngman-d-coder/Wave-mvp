from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'full_name', 'avatar', 'user_type', 'is_verified', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user_type', 'is_verified', 'created_at', 'updated_at')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'phone', 'user_type')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            phone=validated_data.get('phone', ''),
            user_type=validated_data.get('user_type', 'customer'),
            is_verified=False  # Must verify via OTP first
        )
        return user

class OTPSendSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    otp = serializers.CharField(max_length=6)
