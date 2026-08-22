"""
Designation views.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema_view, extend_schema

from apps.employees.models import Designation
from apps.employees.serializers import DesignationSerializer
from common.permissions import IsHROrAdmin, IsOrganizationMember
from common.mixins import OrganizationScopedQuerySetMixin
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Designations"]),
    retrieve=extend_schema(tags=["Designations"]),
    create=extend_schema(tags=["Designations"]),
    partial_update=extend_schema(tags=["Designations"]),
    destroy=extend_schema(tags=["Designations"]),
)
class DesignationViewSet(OrganizationScopedQuerySetMixin, viewsets.ModelViewSet):
    """Designation CRUD — read for org members, write for HR/Admin."""

    queryset = Designation.objects.select_related("organization").all()
    serializer_class = DesignationSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsOrganizationMember()]
        return [IsAuthenticated(), IsHROrAdmin()]

    def perform_create(self, serializer):
        org = self.request.user.employee.organization
        instance = serializer.save(organization=org)
        create_audit_log(
            request=self.request,
            action="CREATE",
            entity_type="Designation",
            entity_id=str(instance.id),
            new_values={"name": instance.name},
        )

    def perform_update(self, serializer):
        old_name = self.get_object().name
        instance = serializer.save()
        create_audit_log(
            request=self.request,
            action="UPDATE",
            entity_type="Designation",
            entity_id=str(instance.id),
            old_values={"name": old_name},
            new_values={"name": instance.name},
        )

    def perform_destroy(self, instance):
        create_audit_log(
            request=self.request,
            action="DELETE",
            entity_type="Designation",
            entity_id=str(instance.id),
            old_values={"name": instance.name},
        )
        instance.delete()
