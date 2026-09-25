from django.urls import path

from .views import (
    AdminCustomersListView,
    AdminDeliveriesListView,
    AdminPricingView,
    AdminRiderDetailView,
    AdminRidersListView,
    AdminTransactionsListView,
    AdminWithdrawalDetailView,
    AdminWithdrawalsListView,
    DashboardStatsView,
)

urlpatterns = [
    path("dashboard/", DashboardStatsView.as_view(), name="admin_dashboard"),
    path("riders/", AdminRidersListView.as_view(), name="admin_riders_list"),
    path("riders/<str:pk>/", AdminRiderDetailView.as_view(), name="admin_rider_detail"),
    path("customers/", AdminCustomersListView.as_view(), name="admin_customers_list"),
    path("deliveries/", AdminDeliveriesListView.as_view(), name="admin_deliveries_list"),
    path("transactions/", AdminTransactionsListView.as_view(), name="admin_transactions_list"),
    path("withdrawals/", AdminWithdrawalsListView.as_view(), name="admin_withdrawals_list"),
    path("withdrawals/<str:pk>/", AdminWithdrawalDetailView.as_view(), name="admin_withdrawal_detail"),
    path("pricing/", AdminPricingView.as_view(), name="admin_pricing"),
]
