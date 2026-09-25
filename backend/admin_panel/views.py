from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import views, status
from rest_framework.response import Response

from riders.models import RiderProfile
from riders.serializers import RiderProfileSerializer
from deliveries.models import Delivery
from deliveries.serializers import DeliverySerializer
from payments.models import Transaction, Withdrawal

from .permissions import IsAdminUser
from .serializers import AdminCustomerSerializer, AdminTransactionSerializer

User = get_user_model()

LIVE_DELIVERY_STATUSES = [
    'searching_rider', 'rider_assigned', 'rider_arrived',
    'picked_up', 'in_transit', 'near_destination',
]


def _pct_change(current, previous):
    if not previous:
        return 0.0
    return round(((current - previous) / previous) * 100, 1)


class DashboardStatsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)

        delivered = Delivery.objects.filter(status='delivered')

        total_revenue = delivered.aggregate(total=Sum('fare_total'))['total'] or 0
        today_revenue = delivered.filter(created_at__gte=today_start).aggregate(
            total=Sum('fare_total')
        )['total'] or 0
        yesterday_revenue = delivered.filter(
            created_at__gte=yesterday_start, created_at__lt=today_start
        ).aggregate(total=Sum('fare_total'))['total'] or 0

        active_riders = RiderProfile.objects.filter(is_online=True).count()
        # RiderProfile stores only current online state, not historical online snapshots.
        # Avoid inventing a misleading day-over-day online-rider trend.

        live_deliveries = Delivery.objects.filter(status__in=LIVE_DELIVERY_STATUSES).count()
        yesterday_deliveries = Delivery.objects.filter(
            created_at__gte=yesterday_start, created_at__lt=today_start
        ).count()
        today_deliveries = Delivery.objects.filter(created_at__gte=today_start).count()

        total_payouts = Withdrawal.objects.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0
        pending_withdrawals = Withdrawal.objects.filter(status__in=['pending', 'processing']).aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Recent activity: latest deliveries, newest first
        recent_activity = []
        for d in Delivery.objects.order_by('-created_at')[:5]:
            recent_activity.append({
                'type': 'delivery',
                'description': f"{d.tracking_number} — {d.get_status_display()}",
                'time': d.updated_at.isoformat(),
            })

        # Top riders by total earnings
        rider_earnings = []
        for profile in RiderProfile.objects.all():
            earnings = Transaction.objects.filter(
                wallet__user=profile.user, transaction_type='earning'
            ).aggregate(total=Sum('amount'))['total'] or 0
            if earnings > 0:
                rider_earnings.append((profile, float(earnings)))
        rider_earnings.sort(key=lambda x: x[1], reverse=True)

        top_riders = []
        for profile, earnings in rider_earnings[:5]:
            deliveries_count = Delivery.objects.filter(rider=profile, status='delivered').count()
            top_riders.append({
                'id': str(profile.user.id),
                'name': profile.user.full_name,
                'avatar': profile.user.avatar.url if profile.user.avatar else None,
                'deliveries': deliveries_count,
                'earnings': earnings,
                'rating': profile.rating,
            })

        return Response({
            'total_revenue': float(total_revenue),
            'today_revenue': float(today_revenue),
            'total_commission': float(total_revenue) * 0.1,
            'active_riders': active_riders,
            'active_customers': User.objects.filter(user_type='customer', is_verified=True).count(),
            'live_deliveries': live_deliveries,
            'total_payouts': float(total_payouts),
            'pending_withdrawals': float(pending_withdrawals),
            'revenue_trend': _pct_change(float(today_revenue), float(yesterday_revenue)),
            'today_trend': _pct_change(float(today_revenue), float(yesterday_revenue)),
            'riders_trend': None,
            'deliveries_trend': _pct_change(today_deliveries, yesterday_deliveries),
            'recent_activity': recent_activity,
            'top_riders': top_riders,
        })


class AdminRidersListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = RiderProfile.objects.all().order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter == 'online':
            qs = qs.filter(is_online=True)
        elif status_filter == 'offline':
            qs = qs.filter(is_online=False)

        serializer = RiderProfileSerializer(qs, many=True, context={'request': request})
        return Response({'count': qs.count(), 'next': None, 'previous': None, 'results': serializer.data})


class AdminRiderDetailView(views.APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            profile = RiderProfile.objects.get(user__id=pk)
        except RiderProfile.DoesNotExist:
            return Response({'message': 'Rider not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid_statuses = dict(RiderProfile.VERIFICATION_CHOICES)
        if new_status not in valid_statuses:
            return Response({"message": "Invalid rider verification status"}, status=status.HTTP_400_BAD_REQUEST)

        profile.verification_status = new_status
        if new_status != "verified":
            profile.is_online = False
        profile.save(update_fields=["verification_status", "is_online", "updated_at"])

        serializer = RiderProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)


class AdminCustomersListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        customers = User.objects.filter(user_type='customer').order_by('-created_at')
        serializer = AdminCustomerSerializer(customers, many=True)
        return Response({'count': customers.count(), 'next': None, 'previous': None, 'results': serializer.data})


class AdminDeliveriesListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Delivery.objects.all().order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = DeliverySerializer(qs, many=True)
        return Response({'count': qs.count(), 'next': None, 'previous': None, 'results': serializer.data})


class AdminTransactionsListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Transaction.objects.all().order_by('-created_at')
        period = request.query_params.get('period')
        now = timezone.now()
        if period == 'today':
            qs = qs.filter(created_at__gte=now.replace(hour=0, minute=0, second=0, microsecond=0))
        elif period == 'week':
            qs = qs.filter(created_at__gte=now - timedelta(days=7))
        elif period == 'month':
            qs = qs.filter(created_at__gte=now - timedelta(days=30))
        elif period == 'year':
            qs = qs.filter(created_at__gte=now - timedelta(days=365))

        serializer = AdminTransactionSerializer(qs, many=True)
        return Response({'count': qs.count(), 'next': None, 'previous': None, 'results': serializer.data})


class AdminPricingView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        return Response(
            {'message': 'Pricing configuration is not implemented yet; no changes were saved.'},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class AdminWithdrawalsListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Withdrawal.objects.select_related("wallet__user", "bank_account").order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        results = [
            {
                "id": str(w.id),
                "amount": float(w.amount),
                "status": w.status,
                "rider_name": w.wallet.user.full_name,
                "rider_email": w.wallet.user.email,
                "bank_name": w.bank_account.bank_name,
                "account_number": f"******{w.bank_account.account_number[-4:]}",
                "account_name": w.bank_account.account_name,
                "requested_at": w.created_at.isoformat(),
                "processed_at": w.processed_at.isoformat() if w.processed_at else None,
            }
            for w in qs
        ]
        return Response({"count": len(results), "next": None, "previous": None, "results": results})


class AdminWithdrawalDetailView(views.APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        new_status = request.data.get("status")
        if new_status not in {"processing", "completed", "rejected"}:
            return Response({"message": "Status must be processing, completed, or rejected"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                withdrawal = Withdrawal.objects.select_for_update().select_related("wallet").get(id=pk)
            except (Withdrawal.DoesNotExist, ValueError):
                return Response({"message": "Withdrawal not found"}, status=status.HTTP_404_NOT_FOUND)

            if withdrawal.status in {"completed", "rejected"}:
                return Response({"message": "This withdrawal has already been finalized"}, status=status.HTTP_409_CONFLICT)

            wallet = withdrawal.wallet
            wallet = wallet.__class__.objects.select_for_update().get(pk=wallet.pk)

            if new_status == "completed":
                if wallet.pending_balance < withdrawal.amount:
                    return Response({"message": "Wallet pending balance is inconsistent"}, status=status.HTTP_409_CONFLICT)
                wallet.pending_balance -= withdrawal.amount
                wallet.save(update_fields=["pending_balance", "updated_at"])
                Transaction.objects.create(
                    wallet=wallet,
                    amount=withdrawal.amount,
                    transaction_type="withdrawal",
                    description=f"Withdrawal payout to {withdrawal.bank_account.bank_name}",
                )
                withdrawal.processed_at = timezone.now()
            elif new_status == "rejected":
                if wallet.pending_balance < withdrawal.amount:
                    return Response({"message": "Wallet pending balance is inconsistent"}, status=status.HTTP_409_CONFLICT)
                wallet.pending_balance -= withdrawal.amount
                wallet.balance += withdrawal.amount
                wallet.save(update_fields=["balance", "pending_balance", "updated_at"])
                withdrawal.processed_at = timezone.now()

            withdrawal.status = new_status
            withdrawal.save(update_fields=["status", "processed_at"])

        return Response({"id": str(withdrawal.id), "status": withdrawal.status})
