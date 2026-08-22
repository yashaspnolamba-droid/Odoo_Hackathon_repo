"""
Employee, Department, Designation, EmploymentHistory, EmployeeDocument, EmployeeInvitation models.
"""
import uuid
import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from common.models import BaseModel
from common.storage import employee_profile_picture_path, employee_document_path
from common.validators import validate_file_size, validate_file_type, validate_image_file


class Department(BaseModel):
    """Department within an organization."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="departments",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    manager = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_departments",
    )

    class Meta:
        ordering = ["name"]
        unique_together = [("organization", "name")]
        indexes = [
            models.Index(fields=["organization", "name"]),
        ]

    def __str__(self):
        return self.name


class Designation(BaseModel):
    """Job title/designation within an organization."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="designations",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    level = models.PositiveIntegerField(
        default=1,
        help_text="Seniority level (1 = entry level, higher = more senior).",
    )

    class Meta:
        ordering = ["level", "name"]
        unique_together = [("organization", "name")]
        indexes = [
            models.Index(fields=["organization", "name"]),
        ]

    def __str__(self):
        return self.name


class Employee(BaseModel):
    """
    Employee record linked to a User and scoped to an Organization.
    Employee ID is auto-generated in format: {ORG_CODE}-{YEAR}-{SEQUENCE}.
    """

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        HR = "HR", "HR"
        EMPLOYEE = "EMPLOYEE", "Employee"

    class EmploymentType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full Time"
        PART_TIME = "PART_TIME", "Part Time"
        CONTRACT = "CONTRACT", "Contract"
        INTERN = "INTERN", "Intern"

    class EmploymentStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ON_LEAVE = "ON_LEAVE", "On Leave"
        TERMINATED = "TERMINATED", "Terminated"

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"
        PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY", "Prefer Not to Say"

    # Core relations
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employee",
        null=True,
        blank=True,
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="employees",
    )
    employee_id = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        blank=True,
        help_text="Auto-generated: {ORG_CODE}-{YEAR}-{SEQ}",
    )

    # Role
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE,
        db_index=True,
    )

    # Personal info
    profile_picture = models.ImageField(
        upload_to=employee_profile_picture_path,
        blank=True,
        null=True,
        validators=[validate_image_file, validate_file_size],
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
        default="",
    )
    phone = models.CharField(max_length=20, blank=True, default="")
    address = models.TextField(blank=True, default="")
    emergency_contact_name = models.CharField(max_length=255, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default="")

    # Employment details
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    designation = models.ForeignKey(
        Designation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    manager = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="direct_reports",
    )
    joining_date = models.DateField(null=True, blank=True)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "employment_status"]),
            models.Index(fields=["organization", "department"]),
            models.Index(fields=["organization", "role"]),
        ]

    def __str__(self):
        if self.user:
            return f"{self.employee_id} - {self.user.full_name}"
        return self.employee_id

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = self._generate_employee_id()
        super().save(*args, **kwargs)

    def _generate_employee_id(self):
        """
        Generate employee ID in format: {ORG_CODE}-{YEAR}-{SEQUENCE}.
        Sequence is per-organization, per-year.
        Uses select_for_update to prevent race conditions.
        """
        from django.db import transaction

        org_code = self.organization.organization_code
        year = timezone.now().year
        prefix = f"{org_code}-{year}-"

        with transaction.atomic():
            last_employee = (
                Employee.objects.select_for_update()
                .filter(employee_id__startswith=prefix)
                .order_by("-employee_id")
                .first()
            )

            if last_employee:
                try:
                    last_seq = int(last_employee.employee_id.split("-")[-1])
                    next_seq = last_seq + 1
                except (ValueError, IndexError):
                    next_seq = 1
            else:
                next_seq = 1

        return f"{org_code}-{year}-{next_seq:05d}"


class EmploymentHistory(BaseModel):
    """
    Tracks employment changes (promotions, transfers, etc.).
    Old records are preserved — never overwritten.
    """

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="employment_history",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    designation = models.ForeignKey(
        Designation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    joining_date = models.DateField(help_text="Start date of this role.")
    end_date = models.DateField(null=True, blank=True, help_text="End date of this role.")
    change_reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="e.g., Promotion, Transfer, Reorganization",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-joining_date"]
        verbose_name_plural = "Employment histories"

    def __str__(self):
        return f"{self.employee.employee_id} - {self.designation} ({self.joining_date})"


class EmployeeDocument(BaseModel):
    """Employee documents — stored via storage abstraction (local/S3/R2)."""

    class DocumentType(models.TextChoices):
        RESUME = "RESUME", "Resume"
        OFFER_LETTER = "OFFER_LETTER", "Offer Letter"
        CERTIFICATE = "CERTIFICATE", "Certificate"
        IDENTITY_DOCUMENT = "IDENTITY_DOCUMENT", "Identity Document"
        OTHER = "OTHER", "Other"

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )
    file = models.FileField(
        upload_to=employee_document_path,
        validators=[validate_file_size, validate_file_type],
    )
    name = models.CharField(max_length=255, help_text="Human-readable document name.")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.document_type})"


class EmployeeInvitation(BaseModel):
    """
    Invitation for an employee to join the organization.
    Token is hashed before storage; raw token is sent via email.
    """

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField(db_index=True)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitations",
        help_text="Pre-created employee record if applicable.",
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        status = "Accepted" if self.accepted_at else "Pending"
        return f"Invitation to {self.email} ({status})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_accepted(self):
        return self.accepted_at is not None

    @classmethod
    def create_invitation(cls, organization, email, created_by, employee=None, expiry_days=7):
        """Create a new invitation. Returns (instance, raw_token)."""
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        instance = cls.objects.create(
            organization=organization,
            email=email.lower(),
            employee=employee,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(days=expiry_days),
            created_by=created_by,
        )
        return instance, raw_token
