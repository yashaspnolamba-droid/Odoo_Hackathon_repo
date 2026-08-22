"""
Serializers for Employee, Department, Designation, and related models.
"""
from rest_framework import serializers
from apps.employees.models import (
    Employee, Department, Designation,
    EmploymentHistory, EmployeeDocument, EmployeeInvitation,
)


# ─── Department Serializers ──────────────────────────────────────

class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id", "name", "description", "manager", "manager_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_manager_name(self, obj):
        if obj.manager and obj.manager.user:
            return obj.manager.user.full_name
        return None

    def validate_name(self, value):
        """Ensure department name is unique within the organization."""
        request = self.context.get("request")
        if request and hasattr(request.user, "employee"):
            org = request.user.employee.organization
            qs = Department.objects.filter(organization=org, name=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f"A department named '{value}' already exists in your organization."
                )
        return value


# ─── Designation Serializers ─────────────────────────────────────

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = [
            "id", "name", "description", "level",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ─── Employee Serializers ────────────────────────────────────────

class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "employee_id", "full_name", "email", "role",
            "department_name", "designation_name",
            "employment_type", "employment_status",
            "joining_date",
        ]

    def get_full_name(self, obj):
        return obj.user.full_name if obj.user else ""

    def get_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_designation_name(self, obj):
        return obj.designation.name if obj.designation else None


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for employee."""

    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    department = DepartmentSerializer(read_only=True)
    designation = DesignationSerializer(read_only=True)
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "employee_id", "full_name", "email", "role",
            "profile_picture", "date_of_birth", "gender",
            "phone", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "department", "designation",
            "manager", "manager_name",
            "joining_date", "employment_type", "employment_status",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "employee_id", "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.full_name if obj.user else ""

    def get_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_manager_name(self, obj):
        if obj.manager and obj.manager.user:
            return obj.manager.user.full_name
        return None


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for HR/Admin creating an employee."""

    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True, required=False, default="")
    last_name = serializers.CharField(write_only=True, required=False, default="")
    department_id = serializers.UUIDField(required=False, allow_null=True)
    designation_id = serializers.UUIDField(required=False, allow_null=True)
    manager_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            "email", "first_name", "last_name",
            "role", "date_of_birth", "gender", "phone", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "department_id", "designation_id", "manager_id",
            "joining_date", "employment_type", "employment_status",
        ]

    def validate_email(self, value):
        from apps.accounts.models import User
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_role(self, value):
        # Only ADMIN can create other ADMINs
        request = self.context.get("request")
        if request and hasattr(request.user, "employee"):
            if value == "ADMIN" and request.user.employee.role != "ADMIN":
                raise serializers.ValidationError("Only admins can create admin accounts.")
        return value


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for HR/Admin updating an employee — all fields accessible."""

    department_id = serializers.UUIDField(required=False, allow_null=True)
    designation_id = serializers.UUIDField(required=False, allow_null=True)
    manager_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            "role", "profile_picture", "date_of_birth", "gender",
            "phone", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "department_id", "designation_id", "manager_id",
            "joining_date", "employment_type", "employment_status",
        ]

    def validate_role(self, value):
        request = self.context.get("request")
        if request and hasattr(request.user, "employee"):
            if value == "ADMIN" and request.user.employee.role != "ADMIN":
                raise serializers.ValidationError("Only admins can assign admin role.")
        return value


class EmployeeSelfUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for employee self-service updates.
    ONLY personal fields are writable — no salary, role, org, status, department.
    """

    class Meta:
        model = Employee
        fields = [
            "profile_picture", "phone", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "date_of_birth", "gender",
        ]


# ─── Employment History ──────────────────────────────────────────

class EmploymentHistorySerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()

    class Meta:
        model = EmploymentHistory
        fields = [
            "id", "department", "department_name",
            "designation", "designation_name",
            "joining_date", "end_date", "change_reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_designation_name(self, obj):
        return obj.designation.name if obj.designation else None


# ─── Employee Document ───────────────────────────────────────────

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = [
            "id", "document_type", "file", "name",
            "uploaded_by", "uploaded_by_name", "created_at",
        ]
        read_only_fields = ["id", "uploaded_by", "created_at"]

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.full_name
        return None


# ─── Employee Invitation ─────────────────────────────────────────

class EmployeeInvitationSerializer(serializers.Serializer):
    """Serializer for inviting an employee."""

    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=Employee.Role.choices,
        default=Employee.Role.EMPLOYEE,
    )
    department_id = serializers.UUIDField(required=False, allow_null=True)
    designation_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_email(self, value):
        from apps.accounts.models import User
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_role(self, value):
        request = self.context.get("request")
        if request and hasattr(request.user, "employee"):
            if value == "ADMIN" and request.user.employee.role != "ADMIN":
                raise serializers.ValidationError("Only admins can invite admin accounts.")
        return value
