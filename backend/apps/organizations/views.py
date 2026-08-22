"""
Organization views.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema_view, extend_schema

from apps.organizations.models import Organization
from apps.organizations.serializers import OrganizationSerializer
from common.permissions import IsAdmin, IsHROrAdmin


@extend_schema_view(
    retrieve=extend_schema(tags=["Organizations"]),
    update=extend_schema(tags=["Organizations"]),
    partial_update=extend_schema(tags=["Organizations"]),
)
class OrganizationViewSet(viewsets.ModelViewSet):
    """
    Organization management.
    Only ADMIN can update organization details.
    Organization is determined by the authenticated user's membership.
    """

    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("partial_update", "update"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "employee") and user.employee.organization_id:
            return Organization.objects.filter(id=user.employee.organization_id)
        return Organization.objects.none()
