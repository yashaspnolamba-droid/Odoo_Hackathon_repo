"""
Authentication views for Dayflow HRMS.
"""
import hashlib
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User, EmailVerificationToken, PasswordResetToken
from apps.accounts.serializers import (
    OrganizationRegistrationSerializer,
    LoginSerializer,
    EmailVerificationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    AcceptInvitationSerializer,
    MeSerializer,
    UserSerializer,
)
from apps.audit.utils import create_audit_log


class LoginThrottle(ScopedRateThrottle):
    scope = "login"


class PasswordResetThrottle(ScopedRateThrottle):
    scope = "password_reset"


class RegisterOrganizationView(GenericAPIView):
    """
    POST /api/v1/auth/register-organization/
    Create a new organization with its initial admin account.
    """

    serializer_class = OrganizationRegistrationSerializer
    permission_classes = [AllowAny]

    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        user = result["user"]
        org = result["organization"]

        # Send email verification
        _, raw_token = EmailVerificationToken.create_token(user)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
        send_mail(
            subject="Verify your Dayflow account",
            message=f"Welcome to Dayflow! Please verify your email: {verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        create_audit_log(
            request=request,
            action="CREATE",
            entity_type="Organization",
            entity_id=str(org.id),
            new_values={"name": org.name, "code": org.organization_code},
            user=user,
            organization=org,
        )

        return Response(
            {
                "success": True,
                "message": "Organization registered successfully. Please verify your email.",
                "data": {
                    "user": UserSerializer(user).data,
                    "organization": {
                        "id": str(org.id),
                        "name": org.name,
                        "organization_code": org.organization_code,
                    },
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(GenericAPIView):
    """
    POST /api/v1/auth/login/
    Authenticate with email and password, returns JWT tokens.
    """

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(GenericAPIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the refresh token.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"], request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}})
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"success": False, "message": "Invalid or expired token.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class RefreshTokenView(GenericAPIView):
    """
    POST /api/v1/auth/refresh/
    Refresh the access token using a valid refresh token.
    """

    permission_classes = [AllowAny]

    @extend_schema(tags=["Auth"], request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}})
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            return Response(
                {
                    "success": True,
                    "message": "Token refreshed successfully.",
                    "data": {
                        "access": str(token.access_token),
                        "refresh": str(token),
                    },
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"success": False, "message": "Invalid or expired refresh token.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class VerifyEmailView(GenericAPIView):
    """
    POST /api/v1/auth/verify-email/
    Verify user's email using the token sent via email.
    """

    serializer_class = EmailVerificationSerializer
    permission_classes = [AllowAny]

    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = EmailVerificationToken.verify_token(serializer.validated_data["token"])
        if not user:
            return Response(
                {"success": False, "message": "Invalid or expired verification token.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_verified = True
        user.save(update_fields=["is_verified"])

        return Response(
            {"success": True, "message": "Email verified successfully."},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(GenericAPIView):
    """
    POST /api/v1/auth/forgot-password/
    Send a password reset email.
    Always returns success to prevent email enumeration.
    """

    serializer_class = ForgotPasswordSerializer
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()
        try:
            user = User.objects.get(email=email, is_active=True)
            _, raw_token = PasswordResetToken.create_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
            send_mail(
                subject="Reset your Dayflow password",
                message=f"Reset your password here: {reset_url}\n\nThis link expires in 1 hour.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass  # Don't reveal whether email exists

        return Response(
            {"success": True, "message": "If an account with that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(GenericAPIView):
    """
    POST /api/v1/auth/reset-password/
    Reset password using the token from email.
    """

    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = PasswordResetToken.verify_token(serializer.validated_data["token"])
        if not user:
            return Response(
                {"success": False, "message": "Invalid or expired reset token.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])

        create_audit_log(
            request=request,
            action="UPDATE",
            entity_type="User",
            entity_id=str(user.id),
            new_values={"action": "password_reset"},
            user=user,
        )

        return Response(
            {"success": True, "message": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )


class AcceptInvitationView(GenericAPIView):
    """
    POST /api/v1/auth/accept-invitation/
    Accept an employee invitation, set name and password.
    """

    serializer_class = AcceptInvitationSerializer
    permission_classes = [AllowAny]

    @extend_schema(tags=["Auth"])
    @transaction.atomic
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_token = serializer.validated_data["token"]
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        from apps.employees.models import EmployeeInvitation
        from django.utils import timezone

        try:
            invitation = EmployeeInvitation.objects.get(
                token_hash=token_hash,
                accepted_at__isnull=True,
                expires_at__gt=timezone.now(),
            )
        except EmployeeInvitation.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid or expired invitation.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create user account
        user = User.objects.create_user(
            email=invitation.email,
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            is_verified=True,  # Email verified via invitation
        )

        # Link user to employee record
        employee = invitation.employee
        if employee:
            employee.user = user
            employee.employment_status = "ACTIVE"
            employee.save(update_fields=["user", "employment_status"])
        else:
            from apps.employees.models import Employee
            Employee.objects.create(
                user=user,
                organization=invitation.organization,
                role="EMPLOYEE",
                employment_type="FULL_TIME",
                employment_status="ACTIVE",
            )

        # Mark invitation as accepted
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_at"])

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        create_audit_log(
            request=request,
            action="CREATE",
            entity_type="Employee",
            entity_id=str(employee.id if employee else user.id),
            new_values={"email": user.email, "action": "invitation_accepted"},
            user=user,
            organization=invitation.organization,
        )

        return Response(
            {
                "success": True,
                "message": "Invitation accepted. Account activated.",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(GenericAPIView):
    """
    GET /api/v1/auth/me/
    Returns the current authenticated user's profile with employee details.
    """

    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"])
    def get(self, request):
        serializer = self.get_serializer(request.user)
        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
