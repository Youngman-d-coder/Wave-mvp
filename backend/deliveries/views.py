from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, views
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import Delivery
from .permissions import IsCustomerUser
from .serializers import CreateDeliverySerializer, DeliverySerializer, FareRequestSerializer
from .services import calculate_fare


class DeliveryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 100


class CalculateFareView(views.APIView):
    permission_classes = [IsCustomerUser]

    def post(self, request):
        serializer = FareRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        fare = calculate_fare(
            data["pickup"]["lat"],
            data["pickup"]["lng"],
            data["dropoff"]["lat"],
            data["dropoff"]["lng"],
            data["weight"],
        )
        return Response(
            {
                "base_fare": float(fare["base_fare"]),
                "distance_charge": float(fare["distance_charge"]),
                "weight_charge": float(fare["weight_charge"]),
                "surge_multiplier": float(fare["surge_multiplier"]),
                "promo_discount": float(fare["promo_discount"]),
                "total": float(fare["total"]),
                "currency": fare["currency"],
            }
        )


class DeliveryListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type == "rider":
            deliveries = Delivery.objects.filter(rider__user=user).exclude(status__in=["delivered", "cancelled", "failed"])
        elif user.user_type == "admin":
            deliveries = Delivery.objects.exclude(status__in=["delivered", "cancelled", "failed"])
        else:
            deliveries = Delivery.objects.filter(customer=user).exclude(status__in=["delivered", "cancelled", "failed"])
        return Response(DeliverySerializer(deliveries.order_by("-created_at"), many=True, context={"request": request}).data)

    def post(self, request):
        if request.user.user_type != "customer":
            return Response({"message": "Only customer accounts can create deliveries"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateDeliverySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        delivery = serializer.save()

        from .consumers import notify_delivery_request

        notify_delivery_request(delivery)
        return Response(
            DeliverySerializer(delivery, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DeliveryDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            delivery = Delivery.objects.get(id=pk)
        except (Delivery.DoesNotExist, ValueError):
            return Response({"message": "Delivery not found"}, status=status.HTTP_404_NOT_FOUND)

        if (
            delivery.customer != request.user
            and (not delivery.rider or delivery.rider.user != request.user)
            and request.user.user_type != "admin"
        ):
            return Response({"message": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        return Response(DeliverySerializer(delivery, context={"request": request}).data)


class CancelDeliveryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .consumers import notify_delivery_request_closed, notify_delivery_update

        with transaction.atomic():
            try:
                delivery = Delivery.objects.select_for_update().get(id=pk)
            except (Delivery.DoesNotExist, ValueError):
                return Response({"message": "Delivery not found"}, status=status.HTTP_404_NOT_FOUND)

            if delivery.customer != request.user and request.user.user_type != "admin":
                return Response({"message": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

            cancellable = {"pending", "searching_rider", "rider_assigned", "rider_arrived"}
            if delivery.status not in cancellable:
                return Response(
                    {"message": f"Cannot cancel delivery in status {delivery.status}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            reason = str(request.data.get("reason", "Cancelled by customer")).strip()[:500]
            delivery.status = "cancelled"
            delivery.add_timeline_event("cancelled", f"Delivery cancelled: {reason}")
            delivery.save(update_fields=["status", "timeline", "updated_at"])

        notify_delivery_request_closed(delivery)
        notify_delivery_update(delivery)
        return Response(DeliverySerializer(delivery, context={"request": request}).data)


class DeliveryHistoryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type == "rider":
            deliveries = Delivery.objects.filter(rider__user=user).order_by("-created_at")
        elif user.user_type == "admin":
            deliveries = Delivery.objects.all().order_by("-created_at")
        else:
            deliveries = Delivery.objects.filter(customer=user).order_by("-created_at")

        paginator = DeliveryPagination()
        page = paginator.paginate_queryset(deliveries, request, view=self)
        serializer = DeliverySerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class RateRiderView(views.APIView):
    permission_classes = [IsCustomerUser]

    def post(self, request, pk):
        try:
            rating = Decimal(str(request.data.get("rating")))
        except Exception:
            return Response({"message": "Rating must be a number from 1 to 5"}, status=status.HTTP_400_BAD_REQUEST)

        if rating < 1 or rating > 5:
            return Response({"message": "Rating must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)

        review = str(request.data.get("review", "")).strip()[:1000]

        with transaction.atomic():
            try:
                delivery = Delivery.objects.select_for_update().get(id=pk)
            except (Delivery.DoesNotExist, ValueError):
                return Response({"message": "Delivery not found"}, status=status.HTTP_404_NOT_FOUND)

            if delivery.customer != request.user:
                return Response({"message": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            if delivery.status != "delivered" or not delivery.rider:
                return Response({"message": "Only completed deliveries can be rated"}, status=status.HTTP_400_BAD_REQUEST)
            if any(event.get("event_type") == "rating" for event in (delivery.timeline or [])):
                return Response({"message": "This delivery has already been rated"}, status=status.HTTP_409_CONFLICT)

            rider = delivery.rider
            total_rating = Decimal(str(rider.rating)) * rider.total_reviews + rating
            rider.total_reviews += 1
            rider.rating = round(float(total_rating / rider.total_reviews), 2)
            rider.save(update_fields=["total_reviews", "rating", "updated_at"])

            delivery.timeline.append(
                {
                    "status": "delivered",
                    "event_type": "rating",
                    "timestamp": timezone.now().isoformat(),
                    "note": f"Customer rated this delivery {rating}/5" + (" with feedback." if review else "."),
                }
            )
            delivery.save(update_fields=["timeline", "updated_at"])

        return Response({"message": "Rating submitted successfully"})
