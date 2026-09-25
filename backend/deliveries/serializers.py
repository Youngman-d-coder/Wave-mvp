from decimal import Decimal

from rest_framework import serializers

from riders.models import RiderProfile
from .models import Delivery
from .services import PACKAGE_MAX_WEIGHTS, calculate_fare


class GeoPointSerializer(serializers.Serializer):
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lng = serializers.FloatField(min_value=-180, max_value=180)


class FareRequestSerializer(serializers.Serializer):
    pickup = GeoPointSerializer()
    dropoff = GeoPointSerializer()
    weight = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=Decimal("0.10"), max_value=Decimal("50.00"))


class DeliveryInputLocationSerializer(serializers.Serializer):
    coordinates = GeoPointSerializer()
    address = serializers.CharField(required=False, allow_blank=True, max_length=255)
    instructions = serializers.CharField(required=False, allow_blank=True, max_length=1000)




class DeliveryCustomerSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True, allow_null=True)
    avatar = serializers.ImageField(read_only=True, allow_null=True)


class DeliveryRiderSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="user.id", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True, allow_null=True)
    avatar = serializers.ImageField(source="user.avatar", read_only=True, allow_null=True)
    is_verified = serializers.BooleanField(source="user.is_verified", read_only=True)
    vehicle = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    current_location = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = RiderProfile
        fields = (
            "id", "full_name", "phone", "avatar", "is_verified", "vehicle",
            "stats", "is_online", "current_location", "rating", "total_reviews", "status",
        )

    def get_vehicle(self, obj):
        return {
            "type": obj.vehicle_type,
            "make": obj.vehicle_make or "",
            "model": obj.vehicle_model or "",
            "year": obj.vehicle_year or 0,
            "color": obj.vehicle_color or "",
            "plate_number": obj.plate_number or "",
        }

    def get_stats(self, obj):
        from django.db.models import Sum
        from deliveries.models import Delivery

        completed = Delivery.objects.filter(rider=obj, status="delivered")
        return {
            "total_kilometers": float(completed.aggregate(total=Sum("estimated_distance"))["total"] or 0),
            "successful_rides": completed.count(),
        }

    def get_current_location(self, obj):
        if obj.latitude is None or obj.longitude is None:
            return None
        return {"lat": obj.latitude, "lng": obj.longitude}

    def get_status(self, obj):
        if not obj.is_online:
            return "offline"
        from deliveries.models import Delivery
        active = Delivery.objects.filter(
            rider=obj,
            status__in=["rider_assigned", "rider_arrived", "picked_up", "in_transit", "near_destination"],
        ).exists()
        return "busy" if active else "online"


class DeliverySerializer(serializers.ModelSerializer):
    customer = DeliveryCustomerSerializer(read_only=True)
    rider = DeliveryRiderSerializer(read_only=True)
    pickup = serializers.SerializerMethodField()
    dropoff = serializers.SerializerMethodField()
    package = serializers.SerializerMethodField()
    fare = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    timeline = serializers.JSONField(read_only=True)

    class Meta:
        model = Delivery
        fields = (
            "id",
            "tracking_number",
            "customer",
            "rider",
            "pickup",
            "dropoff",
            "package",
            "status",
            "fare",
            "payment",
            "timeline",
            "notes",
            "created_at",
            "updated_at",
            "estimated_distance",
            "estimated_duration",
        )
        read_only_fields = fields

    def get_pickup(self, obj):
        return {
            "address": obj.pickup_address,
            "coordinates": {"lat": obj.pickup_lat, "lng": obj.pickup_lng},
            "contact_name": obj.pickup_contact_name,
            "contact_phone": obj.pickup_contact_phone,
            "instructions": obj.pickup_instructions or "",
        }

    def get_dropoff(self, obj):
        return {
            "address": obj.dropoff_address,
            "coordinates": {"lat": obj.dropoff_lat, "lng": obj.dropoff_lng},
            "contact_name": obj.dropoff_contact_name,
            "contact_phone": obj.dropoff_contact_phone,
            "instructions": obj.dropoff_instructions or "",
        }

    def get_package(self, obj):
        return {
            "type": obj.package_type,
            "weight": obj.package_weight,
            "dimensions": {
                "length": obj.package_length,
                "width": obj.package_width,
                "height": obj.package_height,
            },
            "description": obj.package_description or "",
            "is_fragile": obj.package_is_fragile,
        }

    def get_fare(self, obj):
        return {
            "base_fare": float(obj.fare_base),
            "distance_charge": float(obj.fare_distance),
            "weight_charge": float(obj.fare_weight),
            "surge_multiplier": float(obj.fare_surge_multiplier),
            "promo_discount": float(obj.fare_promo_discount),
            "total": float(obj.fare_total),
            "currency": obj.fare_currency,
        }

    def get_payment(self, obj):
        return {
            "id": obj.payment_transaction_id or "",
            "method": obj.payment_method,
            "status": obj.payment_status,
            "amount": float(obj.fare_total),
            "currency": obj.fare_currency,
            "transaction_id": obj.payment_transaction_id or "",
            "paid_at": obj.payment_paid_at.isoformat() if obj.payment_paid_at else None,
        }


class CreateDeliverySerializer(serializers.Serializer):
    pickup = DeliveryInputLocationSerializer()
    dropoff = DeliveryInputLocationSerializer()
    packageType = serializers.ChoiceField(choices=Delivery.PACKAGE_TYPE_CHOICES, required=False, default="small_package")
    weight = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=Decimal("0.10"), max_value=Decimal("50.00"), required=False, default=Decimal("1.00"))
    recipientName = serializers.CharField(max_length=100)
    recipientPhone = serializers.RegexField(r"^\+?[1-9]\d{7,14}$", max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True, default="", max_length=1000)

    def validate(self, attrs):
        package_type = attrs.get("packageType", "small_package")
        weight = attrs.get("weight", Decimal("1.00"))
        max_weight = PACKAGE_MAX_WEIGHTS[package_type]
        if weight > max_weight:
            raise serializers.ValidationError({"weight": f"Maximum weight for this package type is {max_weight} kg."})
        return attrs

    def create(self, validated_data):
        customer = self.context["request"].user
        pickup_data = validated_data["pickup"]
        dropoff_data = validated_data["dropoff"]
        pickup_coords = pickup_data["coordinates"]
        dropoff_coords = dropoff_data["coordinates"]
        weight = validated_data.get("weight", Decimal("1.00"))

        fare = calculate_fare(
            pickup_coords["lat"],
            pickup_coords["lng"],
            dropoff_coords["lat"],
            dropoff_coords["lng"],
            weight,
        )

        delivery = Delivery.objects.create(
            customer=customer,
            pickup_address=pickup_data.get("address") or f"Coordinates: {pickup_coords['lat']:.4f}, {pickup_coords['lng']:.4f}",
            pickup_lat=pickup_coords["lat"],
            pickup_lng=pickup_coords["lng"],
            pickup_contact_name=customer.full_name,
            pickup_contact_phone=customer.phone or "",
            pickup_instructions=pickup_data.get("instructions", ""),
            dropoff_address=dropoff_data.get("address") or f"Coordinates: {dropoff_coords['lat']:.4f}, {dropoff_coords['lng']:.4f}",
            dropoff_lat=dropoff_coords["lat"],
            dropoff_lng=dropoff_coords["lng"],
            dropoff_contact_name=validated_data["recipientName"].strip(),
            dropoff_contact_phone=validated_data["recipientPhone"],
            dropoff_instructions=validated_data.get("notes", ""),
            package_type=validated_data.get("packageType", "small_package"),
            package_weight=float(weight),
            package_is_fragile=validated_data.get("packageType") == "fragile",
            status="searching_rider",
            fare_base=fare["base_fare"],
            fare_distance=fare["distance_charge"],
            fare_weight=fare["weight_charge"],
            fare_total=fare["total"],
            estimated_distance=fare["distance_km"],
            estimated_duration=fare["estimated_duration_minutes"],
            notes=validated_data.get("notes", ""),
        )
        delivery.add_timeline_event("pending", "Delivery request submitted.")
        delivery.add_timeline_event("searching_rider", "Searching for nearby riders.")
        delivery.save(update_fields=["timeline", "updated_at"])
        return delivery
