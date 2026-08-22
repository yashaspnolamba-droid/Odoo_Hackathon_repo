"""
URL routing for authentication endpoints.
"""
from django.urls import path
from apps.accounts.views import (
    RegisterOrganizationView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    AcceptInvitationView,
    MeView,
)

app_name = "accounts"

urlpatterns = [
    path("register-organization/", RegisterOrganizationView.as_view(), name="register-organization"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", RefreshTokenView.as_view(), name="refresh"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("accept-invitation/", AcceptInvitationView.as_view(), name="accept-invitation"),
    path("me/", MeView.as_view(), name="me"),
]
