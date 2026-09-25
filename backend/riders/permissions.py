from rest_framework.permissions import BasePermission


class IsRiderUser(BasePermission):
    """Allow access only to authenticated accounts registered as riders."""

    message = "Rider access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.user_type == "rider"
        )


class IsVerifiedRider(IsRiderUser):
    """Allow operational rider actions only after admin verification."""

    message = "Your rider account must be verified before you can perform this action."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        profile = getattr(request.user, "rider_profile", None)
        return bool(profile and profile.verification_status == "verified")
