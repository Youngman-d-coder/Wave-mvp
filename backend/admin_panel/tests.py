from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AdminPermissionTests(APITestCase):
    def test_user_type_alone_does_not_grant_admin_api_access(self):
        user = User.objects.create_user(
            email="fake-admin@example.com",
            password="StrongPass!2026",
            full_name="Fake Admin",
            phone="+2348030000001",
            user_type="admin",
            is_verified=True,
            is_staff=False,
        )
        self.client.force_authenticate(user)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
