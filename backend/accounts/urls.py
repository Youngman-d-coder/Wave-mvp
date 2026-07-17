from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, VerifyOTPView, ResendOTPView, MeView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth_verify_otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth_resend_otp'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
