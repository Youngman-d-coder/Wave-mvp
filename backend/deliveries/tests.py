from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from deliveries.models import Delivery
from deliveries.serializers import DeliverySerializer
from payments.models import Wallet
from riders.models import BankAccount, RiderProfile

User = get_user_model()


class DeliveryPrivacyTests(APITestCase):
    def test_delivery_payload_does_not_expose_rider_financial_profile(self):
        customer = User.objects.create_user(
            email="customer@example.com",
            password="StrongPass!2026",
            full_name="Customer",
            phone="+2348020000001",
            user_type="customer",
            is_verified=True,
        )
        rider_user = User.objects.create_user(
            email="rider@example.com",
            password="StrongPass!2026",
            full_name="Rider",
            phone="+2348020000002",
            user_type="rider",
            is_verified=True,
        )
        rider = RiderProfile.objects.create(user=rider_user, verification_status="verified")
        Wallet.objects.create(user=rider_user, balance=5000)
        BankAccount.objects.create(
            rider=rider,
            bank_name="Private Bank",
            account_number="0123456789",
            account_name="Rider Person",
            is_default=True,
        )
        delivery = Delivery.objects.create(
            customer=customer,
            rider=rider,
            pickup_address="Pickup",
            pickup_lat=5.48,
            pickup_lng=7.03,
            pickup_contact_name="Customer",
            pickup_contact_phone=customer.phone,
            dropoff_address="Dropoff",
            dropoff_lat=5.49,
            dropoff_lng=7.04,
            dropoff_contact_name="Recipient",
            dropoff_contact_phone="+2348020000003",
            status="rider_assigned",
        )

        data = DeliverySerializer(delivery).data

        self.assertNotIn("wallet", data["rider"])
        self.assertNotIn("bank_accounts", data["rider"])
        self.assertNotIn("email", data["rider"])
        self.assertNotIn("email", data["customer"])
