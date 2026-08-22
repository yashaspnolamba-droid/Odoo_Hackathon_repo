"""
Leave views — types, balances, requests, approve/reject/cancel.
"""
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.leave.models import LeaveType, LeaveBalance, LeaveRequest
from apps.leave.serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer,
    LeaveRequestSerializer, LeaveRequestCreateSerializer,
    LeaveReviewSerializer,
)
from common.permissions import IsHROrAdmin, IsOrganizationMember
from common.mixins import OrganizationScopedQuerySetMixin
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Leave"]),
    retrieve=extend_schema(tags=["Leave"]),
    create=extend_schema(tags=["Leave"]),
    partial_update=extend_schema(tags=["Leave"]),
    destroy=extend_schema(tags=["Leave"]),
)
class LeaveTypeViewSet(OrganizationScopedQuerySetMixin, viewsets.ModelViewSet):
    """Leave type CRUD — read for all, write for HR/Admin."""

    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsOrganizationMember()]
        return [IsAuthenticated(), IsHROrAdmin()]


@extend_schema_view(
    list=extend_schema(tags=["Leave"]),
)
class LeaveBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    """Leave balance — employees see their own, HR/Admin see all."""

    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return LeaveBalance.objects.none()

        qs = LeaveBalance.objects.select_related(
            "employee", "leave_type"
        ).filter(employee__organization=user.employee.organization)

        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs


@extend_schema_view(
    list=extend_schema(tags=["Leave"]),
    retrieve=extend_schema(tags=["Leave"]),
    create=extend_schema(tags=["Leave"]),
)
class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    Leave request API.
    Employees create requests; HR/Admin approve/reject.
    Employees can cancel their own pending requests.
    """

    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "leave_type"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return LeaveRequestCreateSerializer
        if self.action in ("approve", "reject"):
            return LeaveReviewSerializer
        return LeaveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return LeaveRequest.objects.none()

        qs = LeaveRequest.objects.select_related(
            "employee__user", "leave_type"
        ).filter(employee__organization=user.employee.organization)

        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs

    def perform_create(self, serializer):
        employee = self.request.user.employee
        instance = serializer.save(employee=employee)
        create_audit_log(
            request=self.request,
            action="CREATE",
            entity_type="LeaveRequest",
            entity_id=str(instance.id),
            new_values={
                "leave_type": str(instance.leave_type_id),
                "start_date": str(instance.start_date),
                "end_date": str(instance.end_date),
            },
        )

    @extend_schema(tags=["Leave"])
    @action(detail=True, methods=["patch"], url_path="approve")
    def approve(self, request, pk=None):
        """PATCH /api/v1/leave/requests/{id}/approve/"""
        if not hasattr(request.user, "employee") or request.user.employee.role == "EMPLOYEE":
            return Response(
                {"success": False, "message": "HR or Admin access required.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        leave_request = self.get_object()

        # Prevent self-approval
        if leave_request.employee.user_id == request.user.id:
            return Response(
                {"success": False, "message": "You cannot approve your own leave request.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if leave_request.status != "PENDING":
            return Response(
                {"success": False, "message": "Leave request is not pending.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave_request.status = "APPROVED"
        leave_request.reviewed_by = request.user
        leave_request.reviewed_at = timezone.now()
        leave_request.review_comment = serializer.validated_data.get("comment", "")
        leave_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])

        create_audit_log(
            request=request,
            action="APPROVE",
            entity_type="LeaveRequest",
            entity_id=str(leave_request.id),
            new_values={"status": "APPROVED"},
        )

        return Response(
            {"success": True, "message": "Leave request approved."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=["Leave"])
    @action(detail=True, methods=["patch"], url_path="reject")
    def reject(self, request, pk=None):
        """PATCH /api/v1/leave/requests/{id}/reject/"""
        if not hasattr(request.user, "employee") or request.user.employee.role == "EMPLOYEE":
            return Response(
                {"success": False, "message": "HR or Admin access required.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        leave_request = self.get_object()
        if leave_request.status != "PENDING":
            return Response(
                {"success": False, "message": "Leave request is not pending.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave_request.status = "REJECTED"
        leave_request.reviewed_by = request.user
        leave_request.reviewed_at = timezone.now()
        leave_request.review_comment = serializer.validated_data.get("comment", "")
        leave_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])

        create_audit_log(
            request=request,
            action="REJECT",
            entity_type="LeaveRequest",
            entity_id=str(leave_request.id),
            new_values={"status": "REJECTED"},
        )

        return Response(
            {"success": True, "message": "Leave request rejected."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=["Leave"])
    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        """PATCH /api/v1/leave/requests/{id}/cancel/ — employee cancels own request."""
        leave_request = self.get_object()

        # Only the requestor can cancel
        if leave_request.employee.user_id != request.user.id:
            return Response(
                {"success": False, "message": "You can only cancel your own leave requests.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if leave_request.status != "PENDING":
            return Response(
                {"success": False, "message": "Only pending requests can be cancelled.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        leave_request.status = "CANCELLED"
        leave_request.save(update_fields=["status"])

        create_audit_log(
            request=request,
            action="UPDATE",
            entity_type="LeaveRequest",
            entity_id=str(leave_request.id),
            new_values={"status": "CANCELLED"},
        )

        return Response(
            {"success": True, "message": "Leave request cancelled."},
            status=status.HTTP_200_OK,
        )
