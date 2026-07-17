from rest_framework import serializers
from django.contrib.auth import get_user_model
from riders.serializers import RiderProfileSerializer
from accounts.serializers import UserSerializer
from .models import Delivery

User = get_user_model()

class DeliverySerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    rider = RiderProfileSerializer(read_only=True)
    pickup = serializers.SerializerMethodField()
    dropoff = serializers.SerializerMethodField()
    package = serializers.SerializerMethodField()
    fare = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    timeline = serializers.JSONField(read_only=True)

    class Meta:
        model = Delivery
        fields = (
            'id', 'tracking_number', 'customer', 'rider',
            'pickup', 'dropoff', 'package', 'status',
            'fare', 'payment', 'timeline', 'notes',
            'created_at', 'updated_at', 'estimated_distance', 'estimated_duration'
        )
        read_only_fields = ('id', 'tracking_number', 'status', 'created_at', 'updated_at', 'timeline')

    def get_pickup(self, obj):
        return {
            'address': obj.pickup_address,
            'coordinates': {
                'lat': obj.pickup_lat,
                'lng': obj.pickup_lng
            },
            'contact_name': obj.pickup_contact_name,
            'contact_phone': obj.pickup_contact_phone,
            'instructions': obj.pickup_instructions or ''
        }

    def get_dropoff(self, obj):
        return {
            'address': obj.dropoff_address,
            'coordinates': {
                'lat': obj.dropoff_lat,
                'lng': obj.dropoff_lng
            },
            'contact_name': obj.dropoff_contact_name,
            'contact_phone': obj.dropoff_contact_phone,
            'instructions': obj.dropoff_instructions or ''
        }

    def get_package(self, obj):
        return {
            'type': obj.package_type,
            'weight': obj.package_weight,
            'dimensions': {
                'length': obj.package_length,
                'width': obj.package_width,
                'height': obj.package_height
            },
            'description': obj.package_description or '',
            'is_fragile': obj.package_is_fragile
        }

    def get_fare(self, obj):
        return {
            'base_fare': float(obj.fare_base),
            'distance_charge': float(obj.fare_distance),
            'weight_charge': float(obj.fare_weight),
            'surge_multiplier': float(obj.fare_surge_multiplier),
            'promo_discount': float(obj.fare_promo_discount),
            'total': float(obj.fare_total),
            'currency': obj.fare_currency
        }

    def get_payment(self, obj):
        return {
            'id': obj.payment_transaction_id or '',
            'method': obj.payment_method,
            'status': obj.payment_status,
            'amount': float(obj.fare_total),
            'currency': obj.fare_currency,
            'transaction_id': obj.payment_transaction_id or '',
            'paid_at': obj.payment_paid_at.isoformat() if obj.payment_paid_at else None
        }

class CreateDeliverySerializer(serializers.Serializer):
    pickup = serializers.JSONField()
    dropoff = serializers.JSONField()
    packageType = serializers.CharField(required=False, default='small_package')
    weight = serializers.FloatField(required=False, default=1.0)
    recipientName = serializers.CharField()
    recipientPhone = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def create(self, validated_data):
        customer = self.context['request'].user
        pickup_data = validated_data['pickup']
        dropoff_data = validated_data['dropoff']
        
        pickup_coords = pickup_data.get('coordinates', {})
        dropoff_coords = dropoff_data.get('coordinates', {})
        
        pickup_lat = pickup_coords.get('lat', 6.5244)
        pickup_lng = pickup_coords.get('lng', 3.3792)
        dropoff_lat = dropoff_coords.get('lat', 6.5244)
        dropoff_lng = dropoff_coords.get('lng', 3.3792)
        
        # Calculate distance and fare estimates
        # Simple Euclidean distance in degrees scaled (approx 111km per degree)
        import math
        deg_dist = math.sqrt((pickup_lat - dropoff_lat)**2 + (pickup_lng - dropoff_lng)**2)
        estimated_distance = max(deg_dist * 111.0, 0.5) # Minimum 0.5 km
        
        # 1 km takes approx 2.5 minutes
        estimated_duration = estimated_distance * 2.5
        
        # Fare Calculation
        base_fare = 500.00
        per_km_rate = 150.00
        per_kg_rate = 50.00
        
        weight = validated_data.get('weight', 1.0)
        distance_charge = estimated_distance * per_km_rate
        weight_charge = max(weight - 1.0, 0.0) * per_kg_rate
        
        total_fare = base_fare + distance_charge + weight_charge
        
        delivery = Delivery.objects.create(
            customer=customer,
            pickup_address=pickup_data.get('address', f"Coordinates: {pickup_lat:.4f}, {pickup_lng:.4f}"),
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
            pickup_contact_name=customer.full_name,
            pickup_contact_phone=customer.phone or '',
            pickup_instructions=pickup_data.get('instructions', ''),
            
            dropoff_address=dropoff_data.get('address', f"Coordinates: {dropoff_lat:.4f}, {dropoff_lng:.4f}"),
            dropoff_lat=dropoff_lat,
            dropoff_lng=dropoff_lng,
            dropoff_contact_name=validated_data['recipientName'],
            dropoff_contact_phone=validated_data['recipientPhone'],
            dropoff_instructions=validated_data.get('notes', ''),
            
            package_type=validated_data.get('packageType', 'small_package'),
            package_weight=weight,
            
            status='searching_rider', # Set status directly to searching_rider on submit
            
            fare_base=base_fare,
            fare_distance=distance_charge,
            fare_weight=weight_charge,
            fare_total=total_fare,
            
            estimated_distance=estimated_distance,
            estimated_duration=estimated_duration,
            notes=validated_data.get('notes', '')
        )
        
        delivery.add_timeline_event('pending', "Delivery request submitted.")
        delivery.add_timeline_event('searching_rider', "Searching for nearby riders.")
        delivery.save()
        return delivery
