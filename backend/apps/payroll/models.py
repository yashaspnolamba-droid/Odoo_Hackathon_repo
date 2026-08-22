"""
Payroll models — contracts for the payroll module developer.
"""
from django.conf import settings
from django.db import models
from common.models import BaseModel


class SalaryStructure(BaseModel):
    """Defines a salary template that can be assigned to employees."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="salary_structures",
    )
    name = models.CharField(max_length=255, help_text="e.g., Standard Full-Time, Intern")
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("organization", "name")]

    def __str__(self):
        return self.name


class SalaryComponent(BaseModel):
    """Individual component of a salary structure (e.g., Basic, HRA, Tax)."""

    class ComponentType(models.TextChoices):
        EARNING = "EARNING", "Earning"
        DEDUCTION = "DEDUCTION", "Deduction"

    salary_structure = models.ForeignKey(
        SalaryStructure,
        on_delete=models.CASCADE,
        related_name="components",
    )
    name = models.CharField(max_length=255, help_text="e.g., Basic Pay, HRA, PF")
    component_type = models.CharField(
        max_length=20,
        choices=ComponentType.choices,
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Fixed amount. Ignored if is_percentage is True.",
    )
    is_percentage = models.BooleanField(
        default=False,
        help_text="If True, amount is calculated as a percentage.",
    )
    percentage_of = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Component name this percentage is based on (e.g., 'Basic Pay').",
    )

    class Meta:
        ordering = ["component_type", "name"]

    def __str__(self):
        return f"{self.name} ({self.component_type})"


class EmployeeSalary(BaseModel):
    """Links an employee to a salary structure with their specific base salary."""

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="salaries",
    )
    salary_structure = models.ForeignKey(
        SalaryStructure,
        on_delete=models.CASCADE,
        related_name="employee_salaries",
    )
    base_salary = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Annual or monthly base salary (depending on org convention).",
    )
    effective_date = models.DateField(
        help_text="Date from which this salary is effective.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-effective_date"]
        indexes = [
            models.Index(fields=["employee", "-effective_date"]),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.base_salary} (from {self.effective_date})"


class Payslip(BaseModel):
    """Generated payslip for an employee for a specific month."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        GENERATED = "GENERATED", "Generated"
        PAID = "PAID", "Paid"

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="payslips",
    )
    month = models.PositiveIntegerField(help_text="Month (1-12)")
    year = models.PositiveIntegerField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    breakdown = models.JSONField(
        default=dict,
        help_text="Detailed breakdown of earnings and deductions.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-year", "-month"]
        unique_together = [("employee", "month", "year")]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.month}/{self.year}"
