"""
Attendance views — check-in, check-out, list, correction workflow.
"""
from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.attendance.models import AttendanceRecord, AttendanceCorrection
from apps.attendance.serializers import (
    AttendanceRecordSerializer, CheckInSerializer, CheckOutSerializer,
    AttendanceCorrectionSerializer, AttendanceCorrectionCreateSerializer,
    CorrectionReviewSerializer,
)
from common.permissions import IsHROrAdmin, IsOrganizationMember, IsSelfOrHRAdmin
from common.mixins import OrganizationScopedQuerySetMixin
from apps.audit.utils import create_audit_log


@extend_schema_view(
    list=extend_schema(tags=["Attendance"]),
    retrieve=extend_schema(tags=["Attendance"]),
)
class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Attendance record API.
    Employees see their own records; HR/Admin see all in the org.
    """

    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "source", "date"]
    ordering_fields = ["date", "check_in"]
    ordering = ["-date"]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return AttendanceRecord.objects.none()

        qs = AttendanceRecord.objects.select_related(
            "employee__user", "employee__organization"
        ).filter(employee__organization=user.employee.organization)

        # Regular employees only see their own records
        if user.employee.role == "EMPLOYEE":
            qs = qs.filter(employee=user.employee)

        return qs

    @extend_schema(tags=["Attendance"])
    @action(detail=False, methods=["post"], url_path="check-in")
    def check_in(self, request):
        """POST /api/v1/attendance/check-in/ — record check-in."""
        if not hasattr(request.user, "employee"):
            return Response(
                {"success": False, "message": "No employee profile found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        today = timezone.localdate()
        employee = request.user.employee

        # Check if already checked in today
        record, created = AttendanceRecord.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                "check_in": timezone.now(),
                "status": AttendanceRecord.Status.PRESENT,
                "source": serializer.validated_data.get("source", "WEB"),
                "notes": serializer.validated_data.get("notes", ""),
            },
        )

        if not created:
            if record.check_in:
                return Response(
                    {"success": False, "message": "Already checked in today.", "errors": {}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            record.check_in = timezone.now()
            record.status = AttendanceRecord.Status.PRESENT
            record.save(update_fields=["check_in", "status"])

        return Response(
            {
                "success": True,
                "message": "Checked in successfully.",
                "data": AttendanceRecordSerializer(record).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @extend_schema(tags=["Attendance"])
    @action(detail=False, methods=["post"], url_path="check-out")
    def check_out(self, request):
        """POST /api/v1/attendance/check-out/ — record check-out."""
        if not hasattr(request.user, "employee"):
            return Response(
                {"success": False, "message": "No employee profile found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        today = timezone.localdate()
        employee = request.user.employee

        try:
            record = AttendanceRecord.objects.get(employee=employee, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response(
                {"success": False, "message": "No check-in found for today.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.check_out:
            return Response(
                {"success": False, "message": "Already checked out today.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.check_out = timezone.now()

        # Calculate working hours
        if record.check_in:
            diff = record.check_out - record.check_in
            hours = Decimal(str(round(diff.total_seconds() / 3600, 2)))
            record.working_hours = hours

        notes = serializer.validated_data.get("notes", "")
        if notes:
            record.notes = f"{record.notes}\n{notes}".strip() if record.notes else notes

        record.save(update_fields=["check_out", "working_hours", "notes"])

        return Response(
            {
                "success": True,
                "message": "Checked out successfully.",
                "data": AttendanceRecordSerializer(record).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(tags=["Attendance"]),
    create=extend_schema(tags=["Attendance"]),
    retrieve=extend_schema(tags=["Attendance"]),
)
class AttendanceCorrectionViewSet(viewsets.ModelViewSet):
    """
    Attendance correction requests.
    Employees create corrections; HR/Admin approve/reject.
    """

    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return AttendanceCorrectionCreateSerializer
        if self.action in ("approve", "reject"):
            return CorrectionReviewSerializer
        return AttendanceCorrectionSerializer

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "employee"):
            return AttendanceCorrection.objects.none()

        qs = AttendanceCorrection.objects.select_related(
            "employee__user", "attendance_record"
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
            entity_type="AttendanceCorrection",
            entity_id=str(instance.id),
            new_values={
                "field": instance.field_name,
                "old": instance.old_value,
                "new": instance.new_value,
            },
        )

    @extend_schema(tags=["Attendance"])
    @action(detail=True, methods=["patch"], url_path="approve")
    def approve(self, request, pk=None):
        """PATCH /api/v1/attendance/corrections/{id}/approve/"""
        if not hasattr(request.user, "employee") or request.user.employee.role == "EMPLOYEE":
            return Response(
                {"success": False, "message": "HR or Admin access required.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        correction = self.get_object()
        if correction.status != "PENDING":
            return Response(
                {"success": False, "message": "Correction is not pending.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CorrectionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        correction.status = "APPROVED"
        correction.reviewed_by = request.user
        correction.reviewed_at = timezone.now()
        correction.review_comment = serializer.validated_data.get("comment", "")
        correction.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])

        create_audit_log(
            request=request,
            action="APPROVE",
            entity_type="AttendanceCorrection",
            entity_id=str(correction.id),
            new_values={"status": "APPROVED"},
        )

        return Response(
            {"success": True, "message": "Correction approved."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=["Attendance"])
    @action(detail=True, methods=["patch"], url_path="reject")
    def reject(self, request, pk=None):
        """PATCH /api/v1/attendance/corrections/{id}/reject/"""
        if not hasattr(request.user, "employee") or request.user.employee.role == "EMPLOYEE":
            return Response(
                {"success": False, "message": "HR or Admin access required.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        correction = self.get_object()
        if correction.status != "PENDING":
            return Response(
                {"success": False, "message": "Correction is not pending.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CorrectionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        correction.status = "REJECTED"
        correction.reviewed_by = request.user
        correction.reviewed_at = timezone.now()
        correction.review_comment = serializer.validated_data.get("comment", "")
        correction.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])

        create_audit_log(
            request=request,
            action="REJECT",
            entity_type="AttendanceCorrection",
            entity_id=str(correction.id),
            new_values={"status": "REJECTED"},
        )

        return Response(
            {"success": True, "message": "Correction rejected."},
            status=status.HTTP_200_OK,
        )
