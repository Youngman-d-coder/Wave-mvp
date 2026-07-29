from django.urls import path
from .views import (
    DashboardStatsView,
    AdminRidersListView,
    AdminRiderDetailView,
    AdminCustomersListView,
    AdminDeliveriesListView,
    AdminTransactionsListView,
    AdminPricingView,
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='admin_dashboard'),
    path('riders/', AdminRidersListView.as_view(), name='admin_riders_list'),
    path('riders/<str:pk>/', AdminRiderDetailView.as_view(), name='admin_rider_detail'),
    path('customers/', AdminCustomersListView.as_view(), name='admin_customers_list'),
    path('deliveries/', AdminDeliveriesListView.as_view(), name='admin_deliveries_list'),
    path('transactions/', AdminTransactionsListView.as_view(), name='admin_transactions_list'),
    path('pricing/', AdminPricingView.as_view(), name='admin_pricing'),
]
