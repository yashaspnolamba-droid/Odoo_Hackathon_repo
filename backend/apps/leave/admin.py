from django.contrib import admin
from apps.leave.models import LeaveType, LeaveBalance, LeaveRequest, ApprovalRequest, ApprovalStep


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "max_days", "is_paid", "is_active")
    list_filter = ("is_paid", "is_active")


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "year", "total", "used")
    list_filter = ("year",)
    raw_id_fields = ("employee",)


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "start_date", "end_date", "status")
    list_filter = ("status", "leave_type")
    raw_id_fields = ("employee",)


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ("request_type", "requestor", "status", "created_at")
    list_filter = ("request_type", "status")


@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    list_display = ("approval_request", "approver", "order", "status")
    list_filter = ("status",)
