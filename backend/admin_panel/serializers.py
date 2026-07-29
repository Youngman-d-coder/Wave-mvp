from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum
from payments.models import Transaction

User = get_user_model()


class AdminCustomerSerializer(serializers.ModelSerializer):
    total_deliveries = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'phone', 'full_name', 'avatar', 'user_type',
            'is_verified', 'created_at', 'updated_at',
            'total_deliveries', 'total_spent',
        )

    def get_total_deliveries(self, obj):
        return obj.customer_deliveries.count()

    def get_total_spent(self, obj):
        total = obj.customer_deliveries.filter(status='delivered').aggregate(
            total=Sum('fare_total')
        )['total']
        return float(total or 0)


class AdminTransactionSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='transaction_type')
    date = serializers.DateTimeField(source='created_at')
    status = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ('id', 'type', 'amount', 'description', 'date', 'status')

    def get_status(self, obj):
        # Transaction records are only ever written once they've cleared in this MVP
        return 'completed'
