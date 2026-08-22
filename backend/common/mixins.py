"""
Reusable mixins for Dayflow HRMS views.
"""
from rest_framework.exceptions import PermissionDenied


class OrganizationScopedQuerySetMixin:
    """
    Mixin for ViewSets that automatically filters querysets
    to the authenticated user's organization.

    This is CRITICAL for organization-level data isolation.
    Every org-scoped ViewSet must use this mixin.

    Usage:
        class EmployeeViewSet(OrganizationScopedQuerySetMixin, ModelViewSet):
            queryset = Employee.objects.all()
            organization_field = "organization"  # default
    """

    organization_field = "organization"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if not hasattr(user, "employee") or not user.employee.organization_id:
            return queryset.none()

        org_id = user.employee.organization_id
        filter_kwargs = {f"{self.organization_field}_id": org_id}
        return queryset.filter(**filter_kwargs)

    def perform_create(self, serializer):
        """Automatically set organization on create."""
        user = self.request.user
        if not hasattr(user, "employee") or not user.employee.organization_id:
            raise PermissionDenied("You must belong to an organization.")
        serializer.save(organization=user.employee.organization)


class AuditCreateMixin:
    """
    Mixin that creates an audit log entry after create/update/delete operations.

    Usage:
        class EmployeeViewSet(AuditCreateMixin, ModelViewSet):
            audit_entity_type = "Employee"
    """

    audit_entity_type = None

    def perform_create(self, serializer):
        instance = serializer.save()
        self._create_audit_log("CREATE", instance, new_values=serializer.validated_data)
        return instance

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = self._serialize_instance(old_instance)
        instance = serializer.save()
        self._create_audit_log(
            "UPDATE", instance, old_values=old_values, new_values=serializer.validated_data
        )
        return instance

    def perform_destroy(self, instance):
        old_values = self._serialize_instance(instance)
        self._create_audit_log("DELETE", instance, old_values=old_values)
        instance.delete()

    def _create_audit_log(self, action, instance, old_values=None, new_values=None):
        """Create an audit log entry. Imported lazily to avoid circular imports."""
        from apps.audit.utils import create_audit_log

        create_audit_log(
            request=self.request,
            action=action,
            entity_type=self.audit_entity_type or instance.__class__.__name__,
            entity_id=str(instance.pk),
            old_values=old_values,
            new_values=new_values,
        )

    def _serialize_instance(self, instance):
        """Convert model instance fields to a dict for audit logging."""
        data = {}
        for field in instance._meta.fields:
            value = getattr(instance, field.name)
            if hasattr(value, "pk"):
                data[field.name] = str(value.pk)
            elif hasattr(value, "isoformat"):
                data[field.name] = value.isoformat()
            else:
                data[field.name] = str(value) if value is not None else None
        return data
