from django.urls import path
from .views import (
    RiderProfileView,
    ToggleOnlineStatusView,
    RiderEarningsView,
    RiderBankAccountsView,
    RiderWithdrawalsView,
    RiderAcceptDeliveryView,
    RiderRejectDeliveryView,
    RiderUpdateDeliveryStatusView
)

urlpatterns = [
    path('profile/', RiderProfileView.as_view(), name='rider_profile'),
    path('toggle-status/', ToggleOnlineStatusView.as_view(), name='rider_toggle_status'),
    path('earnings/', RiderEarningsView.as_view(), name='rider_earnings'),
    path('bank-accounts/', RiderBankAccountsView.as_view(), name='rider_bank_accounts'),
    path('withdrawals/', RiderWithdrawalsView.as_view(), name='rider_withdrawals'),
    path('deliveries/<str:pk>/accept/', RiderAcceptDeliveryView.as_view(), name='rider_accept_delivery'),
    path('deliveries/<str:pk>/reject/', RiderRejectDeliveryView.as_view(), name='rider_reject_delivery'),
    path('deliveries/<str:pk>/update-status/', RiderUpdateDeliveryStatusView.as_view(), name='rider_update_delivery_status'),
]
