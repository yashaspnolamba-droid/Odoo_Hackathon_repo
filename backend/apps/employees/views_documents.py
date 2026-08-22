"""
Employee document views.
"""
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema_view, extend_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from apps.employees.models import EmployeeDocument
from apps.employees.serializers import EmployeeDocumentSerializer
from common.permissions import IsOrganizationMember
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Employee Documents"]),
    retrieve=extend_schema(tags=["Employee Documents"]),
    create=extend_schema(tags=["Employee Documents"]),
    destroy=extend_schema(tags=["Employee Documents"]),
)
class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    """
    Employee document API.
    Employees see their own documents and can upload/delete them.
    HR/Admin see all in the org and can manage them.
    """

    serializer_class = EmployeeDocumentSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["employee", "document_type"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "delete", "head", "options"]
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return EmployeeDocument.objects.none()

        qs = EmployeeDocument.objects.select_related(
            "employee__user", "uploaded_by"
        ).filter(employee__organization=user.employee.organization)

        # Regular employees only see their own documents
        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Regular employees can only upload for themselves
        if user.employee.role == "EMPLOYEE":
            employee_id_in_data = self.request.data.get("employee")
            if employee_id_in_data and str(employee_id_in_data) != str(user.employee.id):
                raise serializers.ValidationError({"employee": "You can only upload documents for yourself."})
            
            # Ensure it is their document
            instance = serializer.save(uploaded_by=user, employee=user.employee)
        else:
            instance = serializer.save(uploaded_by=user)

        create_audit_log(
            request=self.request,
            action="CREATE",
            entity_type="EmployeeDocument",
            entity_id=str(instance.id),
            new_values={
                "employee_id": instance.employee.employee_id,
                "document_type": instance.document_type,
                "name": instance.name,
            },
        )

    def perform_destroy(self, instance):
        # Employees can only delete their own documents
        user = self.request.user
        if user.employee.role == "EMPLOYEE" and instance.employee_id != user.employee.id:
            raise serializers.ValidationError("You can only delete your own documents.")

        create_audit_log(
            request=self.request,
            action="DELETE",
            entity_type="EmployeeDocument",
            entity_id=str(instance.id),
            old_values={"name": instance.name, "document_type": instance.document_type},
        )
        instance.delete()
