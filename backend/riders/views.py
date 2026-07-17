from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import RiderProfile, BankAccount
from .serializers import RiderProfileSerializer, BankAccountSerializer
from django.utils import timezone
from datetime import timedelta

# Defensive helper to get/create rider profile
def get_rider_profile(user):
    profile, _ = RiderProfile.objects.get_or_create(
        user=user,
        defaults={
            'vehicle_type': 'motorcycle',
            'is_online': False,
            'rating': 5.0,
            'total_reviews': 0,
            'verification_status': 'verified'
        }
    )
    return profile

class RiderProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = get_rider_profile(request.user)
        serializer = RiderProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

class ToggleOnlineStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = get_rider_profile(request.user)
        is_online = request.data.get('is_online', False)
        profile.is_online = is_online
        profile.save()
        serializer = RiderProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

class RiderEarningsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from payments.models import Transaction, Wallet
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        
        # Calculate daily, weekly, monthly earnings
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        transactions = Transaction.objects.filter(wallet=wallet, transaction_type='earning')
        
        today_earnings = sum(t.amount for t in transactions.filter(created_at__gte=today_start))
        week_earnings = sum(t.amount for t in transactions.filter(created_at__gte=week_start))
        month_earnings = sum(t.amount for t in transactions.filter(created_at__gte=month_start))
        total_earnings = sum(t.amount for t in transactions)
        
        return Response({
            'today': float(today_earnings),
            'week': float(week_earnings),
            'month': float(month_earnings),
            'total': float(total_earnings)
        })

class RiderBankAccountsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = get_rider_profile(request.user)
        serializer = BankAccountSerializer(data=request.data)
        if serializer.is_valid():
            # If set as default, mark others as not default
            if serializer.validated_data.get('is_default', False):
                BankAccount.objects.filter(rider=profile).update(is_default=False)
            serializer.save(rider=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RiderWithdrawalsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from payments.models import Withdrawal
        from payments.serializers import WithdrawalSerializer
        profile = get_rider_profile(request.user)
        withdrawals = Withdrawal.objects.filter(wallet__user=request.user).order_by('-created_at')
        serializer = WithdrawalSerializer(withdrawals, many=True)
        return Response({
            'count': len(serializer.data),
            'next': None,
            'previous': None,
            'results': serializer.data
        })

    def post(self, request):
        from payments.models import Wallet, Withdrawal
        from payments.serializers import WithdrawalSerializer
        profile = get_rider_profile(request.user)
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        
        amount = request.data.get('amount')
        bank_account_id = request.data.get('bank_account_id')
        
        if not amount or not bank_account_id:
            return Response({'message': 'Amount and bank account are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            bank_account = BankAccount.objects.get(id=bank_account_id, rider=profile)
        except (BankAccount.DoesNotExist, ValueError):
            return Response({'message': 'Invalid bank account'}, status=status.HTTP_400_BAD_REQUEST)
            
        amount = float(amount)
        if wallet.balance < amount:
            return Response({'message': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Deduct balance and create withdrawal
        wallet.balance -= amount
        wallet.pending_balance += amount
        wallet.save()
        
        withdrawal = Withdrawal.objects.create(
            wallet=wallet,
            amount=amount,
            bank_account=bank_account,
            status='pending'
        )
        
        return Response(WithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)

# Rider specific delivery control views
class RiderAcceptDeliveryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from deliveries.models import Delivery
        from deliveries.serializers import DeliverySerializer
        from deliveries.consumers import notify_delivery_update
        
        profile = get_rider_profile(request.user)
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({'message': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if delivery.status != 'searching_rider' and delivery.status != 'pending':
            return Response({'message': 'Delivery is no longer available'}, status=status.HTTP_400_BAD_REQUEST)
            
        delivery.rider = profile
        delivery.status = 'rider_assigned'
        delivery.add_timeline_event('rider_assigned', "Rider accepted the delivery request.")
        delivery.save()
        
        # Notify consumer
        notify_delivery_update(delivery)
        
        return Response(DeliverySerializer(delivery, context={'request': request}).data, status=status.HTTP_200_OK)

class RiderRejectDeliveryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from deliveries.models import Delivery
        from deliveries.serializers import DeliverySerializer
        
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({'message': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # For simplicity, if a rider rejects, we put it back to searching
        if delivery.rider and delivery.rider.user == request.user:
            delivery.rider = None
            delivery.status = 'searching_rider'
            delivery.add_timeline_event('searching_rider', "Rider declined the request. Searching for another rider.")
            delivery.save()
            
        return Response({'message': 'Delivery rejected'}, status=status.HTTP_200_OK)

class RiderUpdateDeliveryStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from deliveries.models import Delivery
        from deliveries.serializers import DeliverySerializer
        from deliveries.consumers import notify_delivery_update
        
        profile = get_rider_profile(request.user)
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({'message': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if delivery.rider != profile:
            return Response({'message': 'You are not assigned to this delivery'}, status=status.HTTP_403_FORBIDDEN)
            
        new_status = request.data.get('status')
        location = request.data.get('location') # Expects { lat, lng }
        
        if not new_status:
            return Response({'message': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update rider current location if provided
        if location:
            try:
                profile.latitude = float(location.get('lat', profile.latitude))
                profile.longitude = float(location.get('lng', profile.longitude))
                profile.save()
            except (ValueError, TypeError):
                pass
                
        # Transition delivery status
        delivery.status = new_status
        note = f"Delivery status updated to {new_status.replace('_', ' ')}."
        
        # Special action upon completion
        if new_status == 'delivered':
            delivery.add_timeline_event('delivered', "Package delivered successfully.")
            
            # Credit the rider's wallet
            from payments.models import Wallet, Transaction
            wallet, _ = Wallet.objects.get_or_create(user=profile.user)
            amount_earned = float(delivery.fare_total) * 0.9 # Rider gets 90%
            wallet.balance += amount_earned
            wallet.save()
            
            Transaction.objects.create(
                wallet=wallet,
                amount=amount_earned,
                transaction_type='earning',
                description=f"Earnings from delivery {delivery.tracking_number}"
            )
            
            # Update payment status
            if hasattr(delivery, 'payment_info'):
                delivery.payment_info.status = 'completed'
                delivery.payment_info.save()
        else:
            delivery.add_timeline_event(new_status, note)
            
        delivery.save()
        
        # Notify consumer
        notify_delivery_update(delivery)
        
        return Response(DeliverySerializer(delivery, context={'request': request}).data, status=status.HTTP_200_OK)
