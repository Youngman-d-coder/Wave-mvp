from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegistrationSecurityTests(APITestCase):
    def test_public_registration_cannot_create_admin(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "attacker@example.com",
                "password": "StrongPass!2026",
                "full_name": "Public User",
                "phone": "+2348012345678",
                "user_type": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="attacker@example.com").exists())

    def test_phone_is_required_for_registration(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "customer@example.com",
                "password": "StrongPass!2026",
                "full_name": "Customer User",
                "user_type": "customer",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
