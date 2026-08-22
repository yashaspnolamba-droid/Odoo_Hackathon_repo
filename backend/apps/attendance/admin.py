from django.contrib import admin
from apps.attendance.models import AttendanceRecord, AttendanceCorrection


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "date", "status", "check_in", "check_out", "working_hours")
    list_filter = ("status", "source", "date")
    search_fields = ("employee__employee_id",)
    raw_id_fields = ("employee",)


@admin.register(AttendanceCorrection)
class AttendanceCorrectionAdmin(admin.ModelAdmin):
    list_display = ("employee", "attendance_record", "field_name", "status", "created_at")
    list_filter = ("status",)
    raw_id_fields = ("employee", "attendance_record")
