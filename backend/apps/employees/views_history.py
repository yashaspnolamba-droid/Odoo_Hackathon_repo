"""
Employment history views.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema_view, extend_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from apps.employees.models import EmploymentHistory
from apps.employees.serializers import EmploymentHistorySerializer
from common.permissions import IsHROrAdmin, IsOrganizationMember
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Employment History"]),
    retrieve=extend_schema(tags=["Employment History"]),
    create=extend_schema(tags=["Employment History"]),
    partial_update=extend_schema(tags=["Employment History"]),
    destroy=extend_schema(tags=["Employment History"]),
)
class EmploymentHistoryViewSet(viewsets.ModelViewSet):
    """
    Employment history API.
    Employees see their own history; HR/Admin see all in the org and can manage it.
    """

    serializer_class = EmploymentHistorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["employee"]
    ordering = ["-joining_date"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsOrganizationMember()]
        return [IsAuthenticated(), IsHROrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return EmploymentHistory.objects.none()

        qs = EmploymentHistory.objects.select_related(
            "employee__user", "department", "designation"
        ).filter(employee__organization=user.employee.organization)

        # Regular employees only see their own history
        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        create_audit_log(
            request=self.request,
            action="CREATE",
            entity_type="EmploymentHistory",
            entity_id=str(instance.id),
            new_values={
                "employee_id": instance.employee.employee_id,
                "joining_date": str(instance.joining_date),
            },
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_joining_date = str(old_instance.joining_date)
        instance = serializer.save()
        create_audit_log(
            request=self.request,
            action="UPDATE",
            entity_type="EmploymentHistory",
            entity_id=str(instance.id),
            old_values={"joining_date": old_joining_date},
            new_values={"joining_date": str(instance.joining_date)},
        )

    def perform_destroy(self, instance):
        create_audit_log(
            request=self.request,
            action="DELETE",
            entity_type="EmploymentHistory",
            entity_id=str(instance.id),
            old_values={"joining_date": str(instance.joining_date)},
        )
        instance.delete()
