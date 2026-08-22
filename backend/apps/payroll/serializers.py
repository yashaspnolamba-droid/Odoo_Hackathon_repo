"""
Serializers for Payroll module.
"""
from rest_framework import serializers
from apps.payroll.models import SalaryStructure, SalaryComponent, EmployeeSalary, Payslip


class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = [
            "id", "name", "component_type", "amount",
            "is_percentage", "percentage_of",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SalaryStructureSerializer(serializers.ModelSerializer):
    components = SalaryComponentSerializer(many=True, read_only=True)

    class Meta:
        model = SalaryStructure
        fields = [
            "id", "name", "description", "is_active",
            "components", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EmployeeSalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()
    salary_structure_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeSalary
        fields = [
            "id", "employee", "employee_name", "employee_id_display",
            "salary_structure", "salary_structure_name",
            "base_salary", "effective_date", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_employee_name(self, obj):
        return obj.employee.user.full_name if obj.employee.user else ""

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id

    def get_salary_structure_name(self, obj):
        return obj.salary_structure.name


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            "id", "employee", "employee_name", "employee_id_display",
            "month", "year", "base_salary",
            "total_earnings", "total_deductions", "net_salary",
            "breakdown", "status",
            "generated_by", "generated_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "employee_name", "employee_id_display",
            "generated_by", "generated_at",
            "created_at", "updated_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.full_name if obj.employee.user else ""

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id
