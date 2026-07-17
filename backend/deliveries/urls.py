from django.urls import path
from .views import (
    CalculateFareView,
    DeliveryListCreateView,
    DeliveryDetailView,
    CancelDeliveryView,
    DeliveryHistoryView,
    RateRiderView
)

urlpatterns = [
    path('calculate-fare/', CalculateFareView.as_view(), name='delivery_calculate_fare'),
    path('', DeliveryListCreateView.as_view(), name='delivery_list_create'),
    path('history/', DeliveryHistoryView.as_view(), name='delivery_history'),
    path('<str:pk>/', DeliveryDetailView.as_view(), name='delivery_detail'),
    path('<str:pk>/cancel/', CancelDeliveryView.as_view(), name='delivery_cancel'),
    path('<str:pk>/rate/', RateRiderView.as_view(), name='delivery_rate_rider'),
]
