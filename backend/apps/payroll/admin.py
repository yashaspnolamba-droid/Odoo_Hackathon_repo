from django.contrib import admin
from apps.payroll.models import SalaryStructure, SalaryComponent, EmployeeSalary, Payslip


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "is_active")
    list_filter = ("is_active",)


@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ("name", "salary_structure", "component_type", "amount", "is_percentage")
    list_filter = ("component_type",)


@admin.register(EmployeeSalary)
class EmployeeSalaryAdmin(admin.ModelAdmin):
    list_display = ("employee", "salary_structure", "base_salary", "effective_date", "is_active")
    raw_id_fields = ("employee",)


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ("employee", "month", "year", "net_salary", "status")
    list_filter = ("status", "year", "month")
    raw_id_fields = ("employee",)
