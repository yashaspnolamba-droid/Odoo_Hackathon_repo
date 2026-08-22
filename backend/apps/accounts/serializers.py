"""
Serializers for authentication and user management.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.organizations.models import Organization
from apps.employees.models import Employee


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "phone", "is_active", "is_verified", "date_joined", "last_login",
        ]
        read_only_fields = fields


class OrganizationRegistrationSerializer(serializers.Serializer):
    """
    Register a new organization with its initial admin account.
    Creates: Organization → User → Employee (role=ADMIN) atomically.
    """

    # Organization fields
    organization_name = serializers.CharField(max_length=255)
    organization_code = serializers.CharField(max_length=20)
    organization_email = serializers.EmailField(required=False)
    organization_phone = serializers.CharField(max_length=20, required=False, default="")
    organization_address = serializers.CharField(required=False, default="")
    timezone = serializers.CharField(max_length=50, default="UTC")

    # Admin user fields
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate_organization_code(self, value):
        value = value.upper().strip()
        if Organization.objects.filter(organization_code=value).exists():
            raise serializers.ValidationError("An organization with this code already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    @transaction.atomic
    def create(self, validated_data):
        # Create organization
        org = Organization.objects.create(
            name=validated_data["organization_name"],
            organization_code=validated_data["organization_code"],
            email=validated_data.get("organization_email", validated_data["email"]),
            phone=validated_data.get("organization_phone", ""),
            address=validated_data.get("organization_address", ""),
            timezone=validated_data.get("timezone", "UTC"),
        )

        # Create admin user
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            is_verified=False,
        )

        # Create employee record with ADMIN role
        Employee.objects.create(
            user=user,
            organization=org,
            role="ADMIN",
            employment_type="FULL_TIME",
            employment_status="ACTIVE",
        )

        return {"user": user, "organization": org}


class LoginSerializer(serializers.Serializer):
    """Login with email and password."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email", "").lower()
        password = data.get("password", "")

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid email or password."]}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": ["This account has been deactivated."]}
            )

        data["user"] = user
        return data


class EmailVerificationSerializer(serializers.Serializer):
    """Verify email address using token."""

    token = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    """Request a password reset email."""

    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Reset password using token."""

    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data


class AcceptInvitationSerializer(serializers.Serializer):
    """Accept an employee invitation and set password."""

    token = serializers.CharField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data


class MeSerializer(serializers.ModelSerializer):
    """Current user profile with employee details."""

    employee = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "phone",
            "is_verified", "date_joined", "last_login", "employee",
        ]
        read_only_fields = [
            "id", "email", "is_verified", "date_joined", "last_login",
        ]

    def get_employee(self, obj):
        if hasattr(obj, "employee"):
            emp = obj.employee
            return {
                "id": str(emp.id),
                "employee_id": emp.employee_id,
                "role": emp.role,
                "organization": {
                    "id": str(emp.organization.id),
                    "name": emp.organization.name,
                    "organization_code": emp.organization.organization_code,
                },
                "department": {
                    "id": str(emp.department.id),
                    "name": emp.department.name,
                } if emp.department else None,
                "designation": {
                    "id": str(emp.designation.id),
                    "name": emp.designation.name,
                } if emp.designation else None,
                "employment_type": emp.employment_type,
                "employment_status": emp.employment_status,
            }
        return None
