from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def _get_user(user_id):
    try:
        return User.objects.get(id=user_id, is_active=True)
    except (User.DoesNotExist, ValueError, TypeError):
        return AnonymousUser()


class JWTAuthMiddleware:
    """Authenticate WebSocket connections using the same SimpleJWT access token as the API."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        scope["user"] = AnonymousUser()

        try:
            params = parse_qs(scope.get("query_string", b"").decode("utf-8"))
            token = params.get("token", [None])[0]
            if token:
                validated = AccessToken(token)
                scope["user"] = await _get_user(validated.get("user_id"))
        except (TokenError, UnicodeDecodeError, ValueError, TypeError):
            pass

        return await self.app(scope, receive, send)
