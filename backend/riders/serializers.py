import re

from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import serializers

from .models import BankAccount, RiderProfile

User = get_user_model()


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ("id", "bank_name", "account_number", "account_name", "is_default")
        read_only_fields = ("id",)

    def validate_bank_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Enter a valid bank name.")
        return value

    def validate_account_number(self, value):
        value = re.sub(r"\s", "", value)
        if not re.fullmatch(r"\d{10}", value):
            raise serializers.ValidationError("Nigerian bank account numbers must contain 10 digits.")
        return value

    def validate_account_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Enter the account holder name.")
        return value


class RiderProfileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="user.id", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    avatar = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source="user.is_verified", read_only=True)
    user_type = serializers.CharField(source="user.user_type", read_only=True)
    updated_at = serializers.DateTimeField(source="user.updated_at", read_only=True)

    vehicle = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    wallet = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    current_location = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    bank_accounts = BankAccountSerializer(many=True, read_only=True)

    class Meta:
        model = RiderProfile
        fields = (
            "id",
            "email",
            "phone",
            "full_name",
            "avatar",
            "is_verified",
            "user_type",
            "vehicle",
            "documents",
            "wallet",
            "stats",
            "level",
            "is_online",
            "current_location",
            "rating",
            "total_reviews",
            "verification_status",
            "status",
            "bank_accounts",
            "created_at",
            "updated_at",
        )

    def get_avatar(self, obj):
        if not obj.user.avatar:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.user.avatar.url) if request else obj.user.avatar.url

    def get_vehicle(self, obj):
        return {
            "type": obj.vehicle_type,
            "make": obj.vehicle_make or "",
            "model": obj.vehicle_model or "",
            "year": obj.vehicle_year or 0,
            "color": obj.vehicle_color or "",
            "plate_number": obj.plate_number or "",
        }

    def get_documents(self, obj):
        # Document upload fields are not yet part of the MVP data model.
        return {
            "id_card": "",
            "driver_license": "",
            "vehicle_registration": "",
            "insurance": "",
        }

    def get_wallet(self, obj):
        from payments.models import Wallet

        wallet, _ = Wallet.objects.get_or_create(user=obj.user)
        return {
            "balance": float(wallet.balance),
            "pending_balance": float(wallet.pending_balance),
            "currency": wallet.currency,
        }

    def get_stats(self, obj):
        from deliveries.models import Delivery
        from payments.models import Transaction

        deliveries = Delivery.objects.filter(rider=obj)
        delivered = deliveries.filter(status="delivered")
        successful = delivered.count()
        failed = deliveries.filter(status__in=["failed", "cancelled"]).count()
        terminal_total = successful + failed
        completion_rate = (successful / terminal_total * 100) if terminal_total else 100.0

        total_earnings = (
            Transaction.objects.filter(wallet__user=obj.user, transaction_type="earning").aggregate(total=Sum("amount"))["total"]
            or 0
        )
        total_kilometers = delivered.aggregate(total=Sum("estimated_distance"))["total"] or 0

        return {
            "total_kilometers": float(total_kilometers),
            "successful_rides": successful,
            "failed_rides": failed,
            "completion_rate": round(completion_rate, 1),
            "average_rating": obj.rating,
            "total_earnings": float(total_earnings),
            "total_commission_generated": float(total_earnings) / 9 if total_earnings else 0.0,
        }

    def get_level(self, obj):
        from deliveries.models import Delivery

        successful = Delivery.objects.filter(rider=obj, status="delivered").count()
        if successful >= 200:
            return "elite"
        if successful >= 100:
            return "platinum"
        if successful >= 50:
            return "gold"
        if successful >= 15:
            return "silver"
        return "bronze"

    def get_current_location(self, obj):
        if obj.latitude is None or obj.longitude is None:
            return None
        return {"lat": obj.latitude, "lng": obj.longitude}

    def get_status(self, obj):
        if not obj.is_online:
            return "offline"
        from deliveries.models import Delivery

        active_statuses = ["rider_assigned", "rider_arrived", "picked_up", "in_transit", "near_destination"]
        has_active_delivery = Delivery.objects.filter(rider=obj, status__in=active_statuses).exists()
        return "busy" if has_active_delivery else "online"
