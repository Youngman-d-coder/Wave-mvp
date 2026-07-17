from django.urls import path
from .views import PaymentStatusView

urlpatterns = [
    path('status/', PaymentStatusView.as_view(), name='payment_status'),
]
