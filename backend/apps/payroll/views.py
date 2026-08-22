"""
Payroll views — salary structures, employee salary, payslips.
HR/Admin can manage; employees have read-only access to their own data.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.payroll.models import SalaryStructure, SalaryComponent, EmployeeSalary, Payslip
from apps.payroll.serializers import (
    SalaryStructureSerializer, SalaryComponentSerializer,
    EmployeeSalarySerializer, PayslipSerializer,
)
from common.permissions import IsHROrAdmin, IsOrganizationMember
from common.mixins import OrganizationScopedQuerySetMixin
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Payroll"]),
    retrieve=extend_schema(tags=["Payroll"]),
    create=extend_schema(tags=["Payroll"]),
    partial_update=extend_schema(tags=["Payroll"]),
)
class SalaryStructureViewSet(OrganizationScopedQuerySetMixin, viewsets.ModelViewSet):
    """Salary structure CRUD — HR/Admin only."""

    queryset = SalaryStructure.objects.prefetch_related("components").all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsAuthenticated, IsHROrAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]


@extend_schema_view(
    list=extend_schema(tags=["Payroll"]),
    retrieve=extend_schema(tags=["Payroll"]),
    create=extend_schema(tags=["Payroll"]),
    partial_update=extend_schema(tags=["Payroll"]),
)
class EmployeeSalaryViewSet(viewsets.ModelViewSet):
    """
    Employee salary management.
    HR/Admin can assign/update salaries. Employees can view their own.
    Every salary change is audit-logged.
    """

    serializer_class = EmployeeSalarySerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["employee", "is_active"]
    ordering = ["-effective_date"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return EmployeeSalary.objects.none()

        qs = EmployeeSalary.objects.select_related(
            "employee__user", "salary_structure"
        ).filter(employee__organization=user.employee.organization)

        # Regular employees only see their own salary
        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsOrganizationMember()]
        return [IsAuthenticated(), IsHROrAdmin()]

    def perform_create(self, serializer):
        instance = serializer.save()
        create_audit_log(
            request=self.request,
            action="CREATE",
            entity_type="EmployeeSalary",
            entity_id=str(instance.id),
            new_values={
                "employee_id": instance.employee.employee_id,
                "base_salary": str(instance.base_salary),
                "effective_date": str(instance.effective_date),
            },
        )

    def perform_update(self, serializer):
        old = self.get_object()
        old_salary = str(old.base_salary)
        instance = serializer.save()
        create_audit_log(
            request=self.request,
            action="UPDATE",
            entity_type="EmployeeSalary",
            entity_id=str(instance.id),
            old_values={"base_salary": old_salary},
            new_values={
                "base_salary": str(instance.base_salary),
                "effective_date": str(instance.effective_date),
            },
        )


@extend_schema_view(
    list=extend_schema(tags=["Payroll"]),
    retrieve=extend_schema(tags=["Payroll"]),
)
class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Payslip API — read-only.
    Employees see their own payslips; HR/Admin see all in the org.
    """

    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "month", "year"]
    ordering = ["-year", "-month"]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return Payslip.objects.none()

        qs = Payslip.objects.select_related(
            "employee__user"
        ).filter(employee__organization=user.employee.organization)

        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs
