import math
from rest_framework import views, status, permissions
from rest_framework.response import Response
from .models import Delivery
from .serializers import DeliverySerializer, CreateDeliverySerializer

class CalculateFareView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        pickup = request.data.get('pickup')
        dropoff = request.data.get('dropoff')
        weight = float(request.data.get('weight', 1.0))

        if not pickup or not dropoff:
            return Response({'message': 'Pickup and Dropoff locations are required'}, status=status.HTTP_400_BAD_REQUEST)

        pickup_lat = float(pickup.get('lat', 6.5244))
        pickup_lng = float(pickup.get('lng', 3.3792))
        dropoff_lat = float(dropoff.get('lat', 6.5244))
        dropoff_lng = float(dropoff.get('lng', 3.3792))

        # Simple Euclidean distance in degrees scaled to km
        deg_dist = math.sqrt((pickup_lat - dropoff_lat)**2 + (pickup_lng - dropoff_lng)**2)
        estimated_distance = max(deg_dist * 111.0, 0.5)

        # Fare Calculation parameters
        base_fare = 500.00
        per_km_rate = 150.00
        per_kg_rate = 50.00
        
        distance_charge = estimated_distance * per_km_rate
        weight_charge = max(weight - 1.0, 0.0) * per_kg_rate
        total_fare = base_fare + distance_charge + weight_charge

        return Response({
            'base_fare': float(base_fare),
            'distance_charge': float(distance_charge),
            'weight_charge': float(weight_charge),
            'surge_multiplier': 1.0,
            'promo_discount': 0.0,
            'total': float(total_fare),
            'currency': 'NGN'
        })

class DeliveryListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # List active deliveries (i.e. not completed, cancelled, or failed) for both customer and rider
        user = request.user
        if user.user_type == 'rider':
            # Active deliveries assigned to this rider
            deliveries = Delivery.objects.filter(rider__user=user).exclude(status__in=['delivered', 'cancelled', 'failed'])
        else:
            # Active deliveries created by this customer
            deliveries = Delivery.objects.filter(customer=user).exclude(status__in=['delivered', 'cancelled', 'failed'])
            
        serializer = DeliverySerializer(deliveries, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateDeliverySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            delivery = serializer.save()
            return Response(DeliverySerializer(delivery, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeliveryDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({'message': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Ensure user is part of the delivery
        if delivery.customer != request.user and (not delivery.rider or delivery.rider.user != request.user) and request.user.user_type != 'admin':
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = DeliverySerializer(delivery, context={'request': request})
        return Response(serializer.data)

class CancelDeliveryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .consumers import notify_delivery_update
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({'message': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if delivery.customer != request.user and request.user.user_type != 'admin':
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        if delivery.status in ['delivered', 'cancelled', 'failed']:
            return Response({'message': f'Cannot cancel delivery in status {delivery.status}'}, status=status.HTTP_400_BAD_REQUEST)
            
        reason = request.data.get('reason', 'Cancelled by customer')
        delivery.status = 'cancelled'
        delivery.add_timeline_event('cancelled', f"Delivery cancelled: {reason}")
        delivery.save()
        
        # Notify via websocket
        notify_delivery_update(delivery)
        
        return Response(DeliverySerializer(delivery, context={'request': request}).data, status=status.HTTP_200_OK)

class DeliveryHistoryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type == 'rider':
            deliveries = Delivery.objects.filter(rider__user=user).order_by('-created_at')
        else:
            deliveries = Delivery.objects.filter(customer=user).order_by('-created_at')
            
        # Standard paginated layout
        serializer = DeliverySerializer(deliveries, many=True, context={'request': request})
        return Response({
            'count': len(serializer.data),
            'next': None,
            'previous': None,
            'results': serializer.data
        })

class RateRiderView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({'message': 'Delivery not found'}, status=status.HTTP_444_NOT_FOUND)
            
        if delivery.customer != request.user:
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        rating = float(request.data.get('rating', 5))
        review = request.data.get('review', '')
        
        if delivery.rider:
            rider = delivery.rider
            # Update rider rating
            total_rating_val = (rider.rating * rider.total_reviews) + rating
            rider.total_reviews += 1
            rider.rating = round(total_rating_val / rider.total_reviews, 2)
            rider.save()
            
        return Response({'message': 'Rating submitted successfully'}, status=status.HTTP_200_OK)
