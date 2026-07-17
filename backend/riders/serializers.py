from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RiderProfile, BankAccount

User = get_user_model()

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ('id', 'bank_name', 'account_number', 'account_name', 'is_default')
        read_only_fields = ('id',)

class RiderProfileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='user.id', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source='user.is_verified', read_only=True)
    
    vehicle = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    wallet = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    current_location = serializers.SerializerMethodField()

    class Meta:
        model = RiderProfile
        fields = (
            'id', 'email', 'phone', 'full_name', 'avatar', 'is_verified',
            'vehicle', 'documents', 'wallet', 'stats', 'level',
            'is_online', 'current_location', 'rating', 'total_reviews', 'verification_status'
        )

    def get_avatar(self, obj):
        if obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None

    def get_vehicle(self, obj):
        return {
            'type': obj.vehicle_type,
            'make': obj.vehicle_make or '',
            'model': obj.vehicle_model or '',
            'year': obj.vehicle_year or 0,
            'color': obj.vehicle_color or '',
            'plate_number': obj.plate_number or '',
        }

    def get_documents(self, obj):
        return {
            'id_card': '',
            'driver_license': '',
            'vehicle_registration': '',
            'insurance': '',
        }

    def get_wallet(self, obj):
        # Dynamically import to avoid circular dependency
        from payments.models import Wallet
        wallet, _ = Wallet.objects.get_or_create(user=obj.user)
        return {
            'balance': float(wallet.balance),
            'pending_balance': float(wallet.pending_balance),
            'currency': wallet.currency,
        }

    def get_stats(self, obj):
        # Dynamically calculate stats based on deliveries
        from deliveries.models import Delivery
        deliveries = Delivery.objects.filter(rider=obj)
        successful = deliveries.filter(status='delivered').count()
        failed = deliveries.filter(status__in=['failed', 'cancelled']).count()
        total = deliveries.count()
        
        completion_rate = (successful / total * 100) if total > 0 else 100.0
        
        # Calculate earnings
        from payments.models import Transaction
        transactions = Transaction.objects.filter(wallet__user=obj.user, transaction_type='earning')
        total_earnings = sum(t.amount for t in transactions)
        
        return {
            'total_kilometers': sum(d.estimated_distance for d in deliveries.filter(status='delivered')),
            'successful_rides': successful,
            'failed_rides': failed,
            'completion_rate': completion_rate,
            'average_rating': obj.rating,
            'total_earnings': float(total_earnings),
            'total_commission_generated': float(total_earnings * 0.1), # 10% commission
        }

    def get_level(self, obj):
        from deliveries.models import Delivery
        successful = Delivery.objects.filter(rider=obj, status='delivered').count()
        if successful >= 200:
            return 'elite'
        elif successful >= 100:
            return 'platinum'
        elif successful >= 50:
            return 'gold'
        elif successful >= 15:
            return 'silver'
        return 'bronze'

    def get_current_location(self, obj):
        if obj.latitude is not None and obj.longitude is not None:
            return {
                'lat': obj.latitude,
                'lng': obj.longitude
            }
        return None
