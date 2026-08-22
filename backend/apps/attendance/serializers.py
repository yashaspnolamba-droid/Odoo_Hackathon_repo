"""
Serializers for Attendance module.
"""
from rest_framework import serializers
from apps.attendance.models import AttendanceRecord, AttendanceCorrection


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            "id", "employee", "employee_name", "employee_id_display",
            "date", "check_in", "check_out",
            "break_duration", "working_hours", "overtime_hours",
            "status", "source", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "employee", "employee_name", "employee_id_display",
            "working_hours", "created_at", "updated_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.full_name if obj.employee.user else ""

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id


class CheckInSerializer(serializers.Serializer):
    """Check-in — creates or updates today's attendance record."""
    notes = serializers.CharField(required=False, default="")
    source = serializers.ChoiceField(
        choices=AttendanceRecord.Source.choices,
        default=AttendanceRecord.Source.WEB,
    )


class CheckOutSerializer(serializers.Serializer):
    """Check-out — updates today's attendance record."""
    notes = serializers.CharField(required=False, default="")


class AttendanceCorrectionSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceCorrection
        fields = [
            "id", "employee", "employee_name", "attendance_record",
            "field_name", "old_value", "new_value", "reason",
            "status", "reviewed_by", "reviewed_at", "review_comment",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "employee", "employee_name", "status",
            "reviewed_by", "reviewed_at",
            "created_at", "updated_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.full_name if obj.employee.user else ""


class AttendanceCorrectionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceCorrection
        fields = [
            "attendance_record", "field_name",
            "old_value", "new_value", "reason",
        ]

    def validate_attendance_record(self, value):
        """Ensure the attendance record belongs to the requesting employee."""
        request = self.context.get("request")
        if request and hasattr(request.user, "employee"):
            if value.employee_id != request.user.employee.id:
                raise serializers.ValidationError(
                    "You can only request corrections for your own attendance records."
                )
        return value


class CorrectionReviewSerializer(serializers.Serializer):
    """For approving/rejecting an attendance correction."""
    comment = serializers.CharField(required=False, default="")
