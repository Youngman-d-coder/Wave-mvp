from datetime import timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, views
from rest_framework.response import Response

from .models import BankAccount, RiderProfile
from .permissions import IsRiderUser, IsVerifiedRider
from .serializers import BankAccountSerializer, RiderProfileSerializer


ALLOWED_STATUS_TRANSITIONS = {
    "rider_assigned": {"rider_arrived"},
    "rider_arrived": {"picked_up"},
    "picked_up": {"in_transit"},
    "in_transit": {"near_destination", "delivered"},
    "near_destination": {"delivered"},
}


def get_rider_profile(user):
    profile, _ = RiderProfile.objects.get_or_create(
        user=user,
        defaults={
            "vehicle_type": "motorcycle",
            "is_online": False,
            "rating": 5.0,
            "total_reviews": 0,
            "verification_status": "pending",
        },
    )
    return profile


def _delivery_request_payload(delivery):
    return {
        "id": str(delivery.id),
        "pickup": delivery.pickup_address,
        "dropoff": delivery.dropoff_address,
        "distance": f"{delivery.estimated_distance:.1f} km",
        "estimated_fare": float(delivery.fare_total),
        "package_type": delivery.get_package_type_display(),
    }


class RiderProfileView(views.APIView):
    permission_classes = [IsRiderUser]

    def get(self, request):
        profile = get_rider_profile(request.user)
        return Response(RiderProfileSerializer(profile, context={"request": request}).data)


class ToggleOnlineStatusView(views.APIView):
    permission_classes = [IsVerifiedRider]

    def post(self, request):
        profile = get_rider_profile(request.user)
        is_online = request.data.get("is_online")
        if not isinstance(is_online, bool):
            return Response({"message": "is_online must be true or false"}, status=status.HTTP_400_BAD_REQUEST)
        if not is_online:
            from deliveries.models import Delivery
            active_statuses = ["rider_assigned", "rider_arrived", "picked_up", "in_transit", "near_destination"]
            if Delivery.objects.filter(rider=profile, status__in=active_statuses).exists():
                return Response(
                    {"message": "Complete your active delivery before going offline"},
                    status=status.HTTP_409_CONFLICT,
                )
        profile.is_online = is_online
        profile.save(update_fields=["is_online", "updated_at"])
        return Response(RiderProfileSerializer(profile, context={"request": request}).data)


class RiderEarningsView(views.APIView):
    permission_classes = [IsRiderUser]

    def get(self, request):
        from django.db.models import Sum
        from payments.models import Transaction, Wallet

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        previous_month_end = month_start
        previous_month_start = (month_start - timedelta(days=1)).replace(day=1)

        transactions = Transaction.objects.filter(wallet=wallet, transaction_type="earning")

        def total_for(qs):
            return qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        return Response(
            {
                "today": float(total_for(transactions.filter(created_at__gte=today_start))),
                "week": float(total_for(transactions.filter(created_at__gte=week_start))),
                "month": float(total_for(transactions.filter(created_at__gte=month_start))),
                "last_month": float(
                    total_for(
                        transactions.filter(
                            created_at__gte=previous_month_start,
                            created_at__lt=previous_month_end,
                        )
                    )
                ),
                "total": float(total_for(transactions)),
            }
        )


class RiderBankAccountsView(views.APIView):
    permission_classes = [IsRiderUser]

    def post(self, request):
        profile = get_rider_profile(request.user)
        serializer = BankAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            has_accounts = BankAccount.objects.filter(rider=profile).exists()
            make_default = serializer.validated_data.get("is_default", False) or not has_accounts
            if make_default:
                BankAccount.objects.filter(rider=profile).update(is_default=False)
            account = serializer.save(rider=profile, is_default=make_default)

        return Response(BankAccountSerializer(account).data, status=status.HTTP_201_CREATED)


class RiderWithdrawalsView(views.APIView):
    permission_classes = [IsVerifiedRider]

    def get(self, request):
        from payments.models import Withdrawal
        from payments.serializers import WithdrawalSerializer

        withdrawals = Withdrawal.objects.filter(wallet__user=request.user).order_by("-created_at")
        serializer = WithdrawalSerializer(withdrawals, many=True)
        return Response({"count": withdrawals.count(), "next": None, "previous": None, "results": serializer.data})

    def post(self, request):
        from payments.models import Wallet, Withdrawal
        from payments.serializers import WithdrawalSerializer

        profile = get_rider_profile(request.user)
        bank_account_id = request.data.get("bank_account_id")

        try:
            amount = Decimal(str(request.data.get("amount"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        except (InvalidOperation, TypeError, ValueError):
            return Response({"message": "Enter a valid withdrawal amount"}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({"message": "Withdrawal amount must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)
        if not bank_account_id:
            return Response({"message": "Bank account is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bank_account = BankAccount.objects.get(id=bank_account_id, rider=profile)
        except (BankAccount.DoesNotExist, ValueError):
            return Response({"message": "Invalid bank account"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            wallet, _ = Wallet.objects.get_or_create(user=request.user)
            wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
            if wallet.balance < amount:
                return Response({"message": "Insufficient balance"}, status=status.HTTP_400_BAD_REQUEST)

            wallet.balance -= amount
            wallet.pending_balance += amount
            wallet.save(update_fields=["balance", "pending_balance", "updated_at"])
            withdrawal = Withdrawal.objects.create(
                wallet=wallet,
                amount=amount,
                bank_account=bank_account,
                status="pending",
            )

        return Response(WithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)


class AvailableDeliveriesView(views.APIView):
    permission_classes = [IsVerifiedRider]

    def get(self, request):
        from deliveries.models import Delivery

        profile = get_rider_profile(request.user)
        if not profile.is_online:
            return Response({"count": 0, "results": []})

        deliveries = Delivery.objects.filter(status="searching_rider", rider__isnull=True).order_by("created_at")[:20]
        return Response({"count": len(deliveries), "results": [_delivery_request_payload(d) for d in deliveries]})


class RiderAcceptDeliveryView(views.APIView):
    permission_classes = [IsVerifiedRider]

    def post(self, request, pk):
        from deliveries.consumers import notify_delivery_request_closed, notify_delivery_update
        from deliveries.models import Delivery
        from deliveries.serializers import DeliverySerializer

        profile = get_rider_profile(request.user)
        if not profile.is_online:
            return Response({"message": "Go online before accepting deliveries"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock the rider profile as well as the job so two simultaneous accepts
            # cannot assign multiple active deliveries to the same rider.
            profile = RiderProfile.objects.select_for_update().get(pk=profile.pk)
            active_statuses = ["rider_assigned", "rider_arrived", "picked_up", "in_transit", "near_destination"]
            if Delivery.objects.filter(rider=profile, status__in=active_statuses).exists():
                return Response({"message": "Finish your active delivery before accepting another"}, status=status.HTTP_409_CONFLICT)

            try:
                delivery = Delivery.objects.select_for_update().get(id=pk)
            except (Delivery.DoesNotExist, ValueError):
                return Response({"message": "Delivery not found"}, status=status.HTTP_404_NOT_FOUND)

            if delivery.status not in {"searching_rider", "pending"} or delivery.rider_id is not None:
                return Response({"message": "Delivery is no longer available"}, status=status.HTTP_409_CONFLICT)

            delivery.rider = profile
            delivery.status = "rider_assigned"
            delivery.add_timeline_event("rider_assigned", "Rider accepted the delivery request.")
            delivery.save(update_fields=["rider", "status", "timeline", "updated_at"])

        notify_delivery_request_closed(delivery)
        notify_delivery_update(delivery)
        return Response(DeliverySerializer(delivery, context={"request": request}).data)


class RiderRejectDeliveryView(views.APIView):
    permission_classes = [IsVerifiedRider]

    def post(self, request, pk):
        from deliveries.consumers import notify_delivery_request, notify_delivery_update
        from deliveries.models import Delivery

        profile = get_rider_profile(request.user)
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({"message": "Delivery not found"}, status=status.HTTP_404_NOT_FOUND)

        # A broadcast request can be declined locally without changing the shared job.
        if delivery.rider_id is None and delivery.status in {"pending", "searching_rider"}:
            return Response({"message": "Delivery declined"})

        with transaction.atomic():
            delivery = Delivery.objects.select_for_update().get(pk=delivery.pk)
            # Re-check after acquiring the row lock; the delivery may have changed
            # between the initial read and this transaction.
            if delivery.rider != profile or delivery.status != "rider_assigned":
                return Response({"message": "You cannot reject this delivery"}, status=status.HTTP_403_FORBIDDEN)
            delivery.rider = None
            delivery.status = "searching_rider"
            delivery.add_timeline_event("searching_rider", "Rider declined the request. Searching for another rider.")
            delivery.save(update_fields=["rider", "status", "timeline", "updated_at"])

        notify_delivery_update(delivery)
        notify_delivery_request(delivery)
        return Response({"message": "Delivery rejected"})


class RiderUpdateDeliveryStatusView(views.APIView):
    permission_classes = [IsVerifiedRider]

    def post(self, request, pk):
        from payments.models import Transaction, Wallet
        from deliveries.consumers import notify_delivery_update
        from deliveries.models import Delivery
        from deliveries.serializers import DeliverySerializer

        profile = get_rider_profile(request.user)
        new_status = request.data.get("status")
        location = request.data.get("location")

        if not new_status:
            return Response({"message": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                delivery = Delivery.objects.select_for_update().get(id=pk)
            except (Delivery.DoesNotExist, ValueError):
                return Response({"message": "Delivery not found"}, status=status.HTTP_404_NOT_FOUND)

            if delivery.rider != profile:
                return Response({"message": "You are not assigned to this delivery"}, status=status.HTTP_403_FORBIDDEN)

            if new_status == delivery.status:
                return Response(DeliverySerializer(delivery, context={"request": request}).data)

            allowed = ALLOWED_STATUS_TRANSITIONS.get(delivery.status, set())
            if new_status not in allowed:
                return Response(
                    {"message": f"Cannot move delivery from {delivery.status} to {new_status}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if location is not None:
                try:
                    lat = float(location["lat"])
                    lng = float(location["lng"])
                    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                        raise ValueError
                    profile.latitude = lat
                    profile.longitude = lng
                    profile.save(update_fields=["latitude", "longitude", "updated_at"])
                except (KeyError, TypeError, ValueError):
                    return Response({"message": "Invalid rider location"}, status=status.HTTP_400_BAD_REQUEST)

            delivery.status = new_status
            if new_status == "delivered":
                delivery.add_timeline_event("delivered", "Package delivered successfully.")
                wallet, _ = Wallet.objects.get_or_create(user=profile.user)
                wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
                amount_earned = (delivery.fare_total * Decimal("0.90")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                wallet.balance += amount_earned
                wallet.save(update_fields=["balance", "updated_at"])
                Transaction.objects.create(
                    wallet=wallet,
                    amount=amount_earned,
                    transaction_type="earning",
                    description=f"Earnings from delivery {delivery.tracking_number}",
                )
            else:
                delivery.add_timeline_event(
                    new_status,
                    f"Delivery status updated to {new_status.replace('_', ' ')}.",
                )

            delivery.save(update_fields=["status", "timeline", "updated_at"])

        notify_delivery_update(delivery)
        return Response(DeliverySerializer(delivery, context={"request": request}).data)
