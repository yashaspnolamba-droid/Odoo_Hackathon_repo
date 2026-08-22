"""
Employee views — CRUD, self-service, invitation.
"""
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.employees.models import (
    Employee, Department, Designation,
    EmploymentHistory, EmployeeDocument, EmployeeInvitation,
)
from apps.employees.serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer,
    EmployeeCreateSerializer, EmployeeUpdateSerializer,
    EmployeeSelfUpdateSerializer, EmployeeInvitationSerializer,
    EmploymentHistorySerializer, EmployeeDocumentSerializer,
)
from common.permissions import IsHROrAdmin, IsOrganizationMember
from common.mixins import OrganizationScopedQuerySetMixin
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Employees"]),
    retrieve=extend_schema(tags=["Employees"]),
    create=extend_schema(tags=["Employees"]),
    partial_update=extend_schema(tags=["Employees"]),
    destroy=extend_schema(tags=["Employees"]),
)
class EmployeeViewSet(OrganizationScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Employee management — full CRUD for HR/Admin, self-service for employees.
    Organization isolation is enforced via OrganizationScopedQuerySetMixin.
    """

    queryset = Employee.objects.select_related(
        "user", "organization", "department", "designation", "manager__user"
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["employment_status", "employment_type", "department", "designation", "role"]
    search_fields = ["employee_id", "user__email", "user__first_name", "user__last_name"]
    ordering_fields = ["employee_id", "joining_date", "created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return EmployeeListSerializer
        if self.action == "create":
            return EmployeeCreateSerializer
        if self.action in ("update", "partial_update"):
            return EmployeeUpdateSerializer
        if self.action == "me":
            return EmployeeDetailSerializer
        if self.action == "update_me":
            return EmployeeSelfUpdateSerializer
        if self.action == "invite":
            return EmployeeInvitationSerializer
        return EmployeeDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsOrganizationMember()]
        if self.action in ("me", "update_me"):
            return [IsAuthenticated()]
        if self.action in ("create", "update", "partial_update", "destroy", "invite"):
            return [IsAuthenticated(), IsHROrAdmin()]
        return [IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Employee can only see their own record unless HR/Admin
        if (
            hasattr(request.user, "employee")
            and request.user.employee.role == "EMPLOYEE"
            and instance.id != request.user.employee.id
        ):
            return Response(
                {"success": False, "message": "You can only view your own profile.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(instance)
        return Response({"success": True, "data": serializer.data})

    def list(self, request, *args, **kwargs):
        # Regular employees can only see basic info of colleagues
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        org = user.employee.organization
        data = serializer.validated_data

        # Handle FK fields from _id inputs
        department = None
        designation = None
        manager = None

        dept_id = data.pop("department_id", None)
        desig_id = data.pop("designation_id", None)
        mgr_id = data.pop("manager_id", None)
        email = data.pop("email")
        first_name = data.pop("first_name", "")
        last_name = data.pop("last_name", "")

        if dept_id:
            department = Department.objects.filter(id=dept_id, organization=org).first()
        if desig_id:
            designation = Designation.objects.filter(id=desig_id, organization=org).first()
        if mgr_id:
            manager = Employee.objects.filter(id=mgr_id, organization=org).first()

        # Create employee (user will be linked when they accept invitation)
        employee = Employee.objects.create(
            organization=org,
            department=department,
            designation=designation,
            manager=manager,
            **data,
        )

        create_audit_log(
            request=self.request,
            action="CREATE",
            entity_type="Employee",
            entity_id=str(employee.id),
            new_values={"email": email, "employee_id": employee.employee_id},
        )

        return employee

    def perform_update(self, serializer):
        instance = self.get_object()
        old_role = instance.role
        old_dept = str(instance.department_id) if instance.department_id else None

        data = serializer.validated_data
        # Handle FK fields
        if "department_id" in data:
            dept_id = data.pop("department_id")
            if dept_id:
                org = self.request.user.employee.organization
                data["department"] = Department.objects.filter(id=dept_id, organization=org).first()
            else:
                data["department"] = None
        if "designation_id" in data:
            desig_id = data.pop("designation_id")
            if desig_id:
                org = self.request.user.employee.organization
                data["designation"] = Designation.objects.filter(id=desig_id, organization=org).first()
            else:
                data["designation"] = None
        if "manager_id" in data:
            mgr_id = data.pop("manager_id")
            if mgr_id:
                org = self.request.user.employee.organization
                data["manager"] = Employee.objects.filter(id=mgr_id, organization=org).first()
            else:
                data["manager"] = None

        instance = serializer.save(**data)

        # Track role/dept changes in audit
        changes = {}
        if old_role != instance.role:
            changes["role"] = {"old": old_role, "new": instance.role}
        if old_dept != str(instance.department_id):
            changes["department"] = {"old": old_dept, "new": str(instance.department_id)}

        if changes:
            create_audit_log(
                request=self.request,
                action="UPDATE",
                entity_type="Employee",
                entity_id=str(instance.id),
                old_values={"role": old_role},
                new_values=changes,
            )

    def perform_destroy(self, instance):
        """Soft-delete: deactivate instead of deleting."""
        create_audit_log(
            request=self.request,
            action="DELETE",
            entity_type="Employee",
            entity_id=str(instance.id),
            old_values={"employee_id": instance.employee_id, "status": instance.employment_status},
            new_values={"employment_status": "TERMINATED"},
        )
        instance.employment_status = "TERMINATED"
        if instance.user:
            instance.user.is_active = False
            instance.user.save(update_fields=["is_active"])
        instance.save(update_fields=["employment_status"])

    @extend_schema(tags=["Employees"])
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """GET /api/v1/employees/me/ — current user's employee profile."""
        if not hasattr(request.user, "employee"):
            return Response(
                {"success": False, "message": "No employee profile found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = EmployeeDetailSerializer(request.user.employee)
        return Response({"success": True, "data": serializer.data})

    @extend_schema(tags=["Employees"])
    @me.mapping.patch
    def update_me(self, request):
        """PATCH /api/v1/employees/me/ — employee self-update (restricted fields only)."""
        if not hasattr(request.user, "employee"):
            return Response(
                {"success": False, "message": "No employee profile found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = EmployeeSelfUpdateSerializer(
            request.user.employee, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        create_audit_log(
            request=request,
            action="UPDATE",
            entity_type="Employee",
            entity_id=str(request.user.employee.id),
            new_values={"action": "self_update", "fields": list(request.data.keys())},
        )

        return Response({"success": True, "message": "Profile updated.", "data": serializer.data})

    @extend_schema(tags=["Employees"])
    @action(detail=False, methods=["post"], url_path="invite")
    @transaction.atomic
    def invite(self, request):
        """POST /api/v1/employees/invite/ — invite an employee via email."""
        serializer = EmployeeInvitationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        org = request.user.employee.organization

        # Pre-create employee record
        department = None
        designation = None
        if data.get("department_id"):
            department = Department.objects.filter(id=data["department_id"], organization=org).first()
        if data.get("designation_id"):
            designation = Designation.objects.filter(id=data["designation_id"], organization=org).first()

        employee = Employee.objects.create(
            organization=org,
            role=data.get("role", "EMPLOYEE"),
            department=department,
            designation=designation,
            employment_status="INACTIVE",
        )

        # Create invitation
        invitation, raw_token = EmployeeInvitation.create_invitation(
            organization=org,
            email=data["email"],
            created_by=request.user,
            employee=employee,
        )

        # Send invitation email
        invite_url = f"{settings.FRONTEND_URL}/accept-invitation?token={raw_token}"
        send_mail(
            subject=f"You're invited to join {org.name} on Dayflow",
            message=(
                f"You've been invited to join {org.name}.\n\n"
                f"Click here to set up your account: {invite_url}\n\n"
                f"This invitation expires in 7 days."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[data["email"]],
            fail_silently=True,
        )

        create_audit_log(
            request=request,
            action="CREATE",
            entity_type="EmployeeInvitation",
            entity_id=str(invitation.id),
            new_values={"email": data["email"], "role": data.get("role", "EMPLOYEE")},
        )

        return Response(
            {
                "success": True,
                "message": f"Invitation sent to {data['email']}.",
                "data": {
                    "invitation_id": str(invitation.id),
                    "employee_id": employee.employee_id,
                },
            },
            status=status.HTTP_201_CREATED,
        )
