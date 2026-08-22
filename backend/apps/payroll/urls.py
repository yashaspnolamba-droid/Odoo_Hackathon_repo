"""Payroll URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.payroll.views import SalaryStructureViewSet, EmployeeSalaryViewSet, PayslipViewSet

app_name = "payroll"

router = DefaultRouter()
router.register("structures", SalaryStructureViewSet, basename="salary-structure")
router.register("salary", EmployeeSalaryViewSet, basename="employee-salary")
router.register("payslips", PayslipViewSet, basename="payslip")

urlpatterns = [
    path("", include(router.urls)),
]
