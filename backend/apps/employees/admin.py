from django.contrib import admin
from apps.employees.models import (
    Employee, Department, Designation,
    EmploymentHistory, EmployeeDocument, EmployeeInvitation,
)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "get_name", "role", "department", "employment_status", "joining_date")
    list_filter = ("role", "employment_status", "employment_type", "department")
    search_fields = ("employee_id", "user__email", "user__first_name", "user__last_name")
    readonly_fields = ("id", "employee_id", "created_at", "updated_at")
    raw_id_fields = ("user", "organization", "department", "designation", "manager")

    def get_name(self, obj):
        return obj.user.full_name if obj.user else "—"
    get_name.short_description = "Name"


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "manager", "created_at")
    list_filter = ("organization",)
    search_fields = ("name",)


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "level", "created_at")
    list_filter = ("organization", "level")
    search_fields = ("name",)


@admin.register(EmploymentHistory)
class EmploymentHistoryAdmin(admin.ModelAdmin):
    list_display = ("employee", "department", "designation", "joining_date", "end_date")
    list_filter = ("department",)
    raw_id_fields = ("employee",)


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ("name", "employee", "document_type", "created_at")
    list_filter = ("document_type",)
    raw_id_fields = ("employee",)


@admin.register(EmployeeInvitation)
class EmployeeInvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "organization", "accepted_at", "expires_at", "created_at")
    list_filter = ("organization",)
    search_fields = ("email",)
    readonly_fields = ("token_hash",)
