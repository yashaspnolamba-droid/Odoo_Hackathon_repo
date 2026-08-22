"""
Serializers for Leave module.
"""
from rest_framework import serializers
from apps.leave.models import LeaveType, LeaveBalance, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            "id", "name", "max_days", "is_paid", "is_active",
            "description", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.SerializerMethodField()
    remaining = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            "id", "employee", "leave_type", "leave_type_name",
            "year", "total", "used", "remaining",
        ]
        read_only_fields = ["id", "employee", "used", "remaining"]

    def get_leave_type_name(self, obj):
        return obj.leave_type.name


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.SerializerMethodField()
    days_requested = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "employee_name",
            "leave_type", "leave_type_name",
            "start_date", "end_date", "days_requested",
            "reason", "attachment", "status",
            "reviewed_by", "reviewed_at", "review_comment",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "employee", "employee_name", "days_requested",
            "status", "reviewed_by", "reviewed_at",
            "created_at", "updated_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.full_name if obj.employee.user else ""

    def get_leave_type_name(self, obj):
        return obj.leave_type.name


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ["leave_type", "start_date", "end_date", "reason", "attachment"]

    def validate(self, data):
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )
        return data


class LeaveReviewSerializer(serializers.Serializer):
    """For approving/rejecting a leave request."""
    comment = serializers.CharField(required=False, default="")
