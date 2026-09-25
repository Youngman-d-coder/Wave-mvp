from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from deliveries.models import Delivery
from payments.models import Transaction, Wallet
from riders.models import BankAccount, RiderProfile

User = get_user_model()


def make_user(email, phone, user_type):
    return User.objects.create_user(
        email=email,
        password="StrongPass!2026",
        full_name=email.split("@")[0].title(),
        phone=phone,
        user_type=user_type,
        is_verified=True,
    )


def make_delivery(customer, rider, status_value="near_destination", fare=Decimal("1000.00")):
    return Delivery.objects.create(
        customer=customer,
        rider=rider,
        pickup_address="1 Pickup Road",
        pickup_lat=5.48,
        pickup_lng=7.03,
        pickup_contact_name=customer.full_name,
        pickup_contact_phone=customer.phone,
        dropoff_address="2 Dropoff Road",
        dropoff_lat=5.49,
        dropoff_lng=7.04,
        dropoff_contact_name="Recipient",
        dropoff_contact_phone="+2348099999999",
        status=status_value,
        fare_total=fare,
    )


class RiderAuthorizationTests(APITestCase):
    def setUp(self):
        self.customer = make_user("customer@example.com", "+2348010000001", "customer")
        self.rider_user = make_user("rider@example.com", "+2348010000002", "rider")
        self.rider = RiderProfile.objects.create(
            user=self.rider_user,
            verification_status="verified",
            is_online=True,
        )

    def test_customer_cannot_open_rider_profile_endpoint(self):
        self.client.force_authenticate(self.customer)
        response = self.client.get("/api/riders/profile/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(RiderProfile.objects.filter(user=self.customer).exists())

    def test_negative_withdrawal_cannot_increase_wallet(self):
        wallet = Wallet.objects.create(user=self.rider_user, balance=Decimal("1000.00"))
        account = BankAccount.objects.create(
            rider=self.rider,
            bank_name="Test Bank",
            account_number="0123456789",
            account_name="Test Rider",
            is_default=True,
        )
        self.client.force_authenticate(self.rider_user)

        response = self.client.post(
            "/api/riders/withdrawals/",
            {"amount": "-500.00", "bank_account_id": str(account.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        wallet.refresh_from_db()
        self.assertEqual(wallet.balance, Decimal("1000.00"))
        self.assertEqual(wallet.pending_balance, Decimal("0.00"))

    def test_completed_delivery_is_credited_only_once(self):
        delivery = make_delivery(self.customer, self.rider)
        self.client.force_authenticate(self.rider_user)

        first = self.client.post(
            f"/api/riders/deliveries/{delivery.id}/update-status/",
            {"status": "delivered"},
            format="json",
        )
        second = self.client.post(
            f"/api/riders/deliveries/{delivery.id}/update-status/",
            {"status": "delivered"},
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        wallet = Wallet.objects.get(user=self.rider_user)
        self.assertEqual(wallet.balance, Decimal("900.00"))
        self.assertEqual(
            Transaction.objects.filter(wallet=wallet, transaction_type="earning").count(),
            1,
        )

    def test_rider_cannot_go_offline_during_active_delivery(self):
        make_delivery(self.customer, self.rider, status_value="in_transit")
        self.client.force_authenticate(self.rider_user)

        response = self.client.post(
            "/api/riders/toggle-status/",
            {"is_online": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.rider.refresh_from_db()
        self.assertTrue(self.rider.is_online)
