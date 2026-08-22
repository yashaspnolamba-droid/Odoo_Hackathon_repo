"""
Authentication tests for Dayflow HRMS.
Covers: registration, login, invalid login, password reset, email verification, invitation.
"""
import pytest
from django.test import override_settings
from rest_framework import status

from apps.accounts.models import User, EmailVerificationToken, PasswordResetToken
from apps.employees.models import Employee, EmployeeInvitation
from apps.organizations.models import Organization
from tests.conftest import auth_client


@pytest.mark.django_db
class TestOrganizationRegistration:
    """Tests for POST /api/v1/auth/register-organization/"""

    URL = "/api/v1/auth/register-organization/"

    def test_register_organization_success(self, api_client):
        data = {
            "organization_name": "Test Corp",
            "organization_code": "TEST",
            "email": "admin@test.com",
            "first_name": "Test",
            "last_name": "Admin",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
        }
        response = api_client.post(self.URL, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "tokens" in response.data["data"]
        assert "access" in response.data["data"]["tokens"]
        assert "refresh" in response.data["data"]["tokens"]

        # Verify org created
        assert Organization.objects.filter(organization_code="TEST").exists()

        # Verify user created
        user = User.objects.get(email="admin@test.com")
        assert user.first_name == "Test"

        # Verify employee with ADMIN role
        employee = Employee.objects.get(user=user)
        assert employee.role == "ADMIN"
        assert employee.organization.organization_code == "TEST"

    def test_register_duplicate_org_code(self, api_client, org_a):
        data = {
            "organization_name": "Another Corp",
            "organization_code": "ACME",  # Already exists
            "email": "new@test.com",
            "first_name": "New",
            "last_name": "Admin",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
        }
        response = api_client.post(self.URL, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, admin_user):
        data = {
            "organization_name": "New Corp",
            "organization_code": "NEW",
            "email": "admin@acme.com",  # Already exists
            "first_name": "New",
            "last_name": "Admin",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
        }
        response = api_client.post(self.URL, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, api_client):
        data = {
            "organization_name": "Test Corp",
            "organization_code": "TEST",
            "email": "admin@test.com",
            "first_name": "Test",
            "last_name": "Admin",
            "password": "SecurePass123!",
            "password_confirm": "DifferentPass123!",
        }
        response = api_client.post(self.URL, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, api_client):
        data = {
            "organization_name": "Test Corp",
            "organization_code": "TEST",
            "email": "admin@test.com",
            "first_name": "Test",
            "last_name": "Admin",
            "password": "123",
            "password_confirm": "123",
        }
        response = api_client.post(self.URL, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    """Tests for POST /api/v1/auth/login/"""

    URL = "/api/v1/auth/login/"

    def test_login_success(self, api_client, admin_user):
        response = api_client.post(
            self.URL,
            {"email": "admin@acme.com", "password": "AdminPass123!"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert "tokens" in response.data["data"]

    def test_login_wrong_password(self, api_client, admin_user):
        response = api_client.post(
            self.URL,
            {"email": "admin@acme.com", "password": "WrongPass123!"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post(
            self.URL,
            {"email": "nobody@acme.com", "password": "SomePass123!"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_inactive_user(self, api_client, admin_user):
        admin_user.is_active = False
        admin_user.save()
        response = api_client.post(
            self.URL,
            {"email": "admin@acme.com", "password": "AdminPass123!"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogout:
    """Tests for POST /api/v1/auth/logout/"""

    URL = "/api/v1/auth/logout/"

    def test_logout_success(self, admin_user):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(admin_user)
        client = auth_client(admin_user)
        response = client.post(self.URL, {"refresh": str(refresh)}, format="json")
        assert response.status_code == status.HTTP_200_OK

    def test_logout_without_token(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(self.URL, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEmailVerification:
    """Tests for POST /api/v1/auth/verify-email/"""

    URL = "/api/v1/auth/verify-email/"

    def test_verify_email_success(self, api_client, admin_user):
        _, raw_token = EmailVerificationToken.create_token(admin_user)
        response = api_client.post(self.URL, {"token": raw_token}, format="json")
        assert response.status_code == status.HTTP_200_OK
        admin_user.refresh_from_db()
        assert admin_user.is_verified is True

    def test_verify_email_invalid_token(self, api_client):
        response = api_client.post(self.URL, {"token": "invalid-token"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPasswordReset:
    """Tests for forgot-password + reset-password flow."""

    FORGOT_URL = "/api/v1/auth/forgot-password/"
    RESET_URL = "/api/v1/auth/reset-password/"

    def test_forgot_password_sends_response(self, api_client, admin_user):
        response = api_client.post(
            self.FORGOT_URL, {"email": "admin@acme.com"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_forgot_password_nonexistent_email(self, api_client):
        # Should still return 200 to prevent email enumeration
        response = api_client.post(
            self.FORGOT_URL, {"email": "nobody@acme.com"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_reset_password_success(self, api_client, admin_user):
        _, raw_token = PasswordResetToken.create_token(admin_user)
        response = api_client.post(
            self.RESET_URL,
            {
                "token": raw_token,
                "password": "NewSecurePass123!",
                "password_confirm": "NewSecurePass123!",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        # Verify new password works
        admin_user.refresh_from_db()
        assert admin_user.check_password("NewSecurePass123!")

    def test_reset_password_invalid_token(self, api_client):
        response = api_client.post(
            self.RESET_URL,
            {
                "token": "invalid-token",
                "password": "NewSecurePass123!",
                "password_confirm": "NewSecurePass123!",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestInvitation:
    """Tests for invitation acceptance."""

    INVITE_URL = "/api/v1/employees/invite/"
    ACCEPT_URL = "/api/v1/auth/accept-invitation/"

    def test_invite_and_accept(self, admin_user, org_a):
        # HR/Admin invites employee
        client = auth_client(admin_user)
        response = client.post(
            self.INVITE_URL,
            {"email": "newhire@acme.com", "role": "EMPLOYEE"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

        # Get the raw token from the invitation
        invitation = EmployeeInvitation.objects.get(email="newhire@acme.com")
        import secrets
        import hashlib
        # We need the raw token; since we can't get it from DB, create a new one for testing
        _, raw_token = EmployeeInvitation.create_invitation(
            organization=org_a,
            email="newhire2@acme.com",
            created_by=admin_user,
        )

        # Accept invitation
        accept_response = APIClient().post(
            self.ACCEPT_URL,
            {
                "token": raw_token,
                "first_name": "New",
                "last_name": "Hire",
                "password": "NewHirePass123!",
                "password_confirm": "NewHirePass123!",
            },
            format="json",
        )
        assert accept_response.status_code == status.HTTP_201_CREATED
        assert accept_response.data["success"] is True

        # Verify user was created
        assert User.objects.filter(email="newhire2@acme.com").exists()


@pytest.mark.django_db
class TestMe:
    """Tests for GET /api/v1/auth/me/"""

    URL = "/api/v1/auth/me/"

    def test_me_authenticated(self, admin_user):
        client = auth_client(admin_user)
        response = client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["email"] == "admin@acme.com"
        assert response.data["data"]["employee"]["role"] == "ADMIN"

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# Import APIClient at module level for the invitation test
from rest_framework.test import APIClient
