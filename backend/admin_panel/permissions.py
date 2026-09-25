from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to trusted staff accounts explicitly marked as WAVE admins."""

    message = "Administrator access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
            and request.user.user_type == "admin"
        )
