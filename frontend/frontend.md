# Dayflow --- Human Resource Management System

> **Every workday, perfectly aligned.**

## Frontend Implementation Documentation

This document covers the frontend implementation of Dayflow from **3.1**
**Authentication & Authorization** through **3.6 Payroll / Salary**
**Management**.
It separates: - Requirements from the specification - Frontend
workflows - UI responsibilities - Recommended value additions - React +
TypeScript implementation direction

> **Important:** Frontend role-based UI is not a security boundary.
> Final authentication, authorization, validation, payroll rules, and
> data persistence must be enforced by the backend.

---

# 1. Frontend Technology Stack

Technology     Purpose

---

HTML           Initial semantic UI prototype
CSS            Styling and responsive layout
JavaScript     Initial interaction prototype
React          Component-based application UI
TypeScript     Type safety and maintainability
Tailwind CSS   Utility-based React styling
Next.js        React framework and routing

## Development Workflow

For each module:

```
HTML → CSS → JavaScript → React → TypeScript → Tailwind → Backend integration
```

The HTML/CSS/JS stage is useful for quickly proving the UI and
interaction. The React + TypeScript stage becomes the actual application
frontend.

---

# 2. Application-Level Workflow

```
User
  ↓
Authentication
  ↓
Role Detection
  ├── Employee
  │    └── Employee Dashboard
  │         ├── Profile
  │         ├── Attendance
  │         ├── Leave
  │         └── Payroll
  │
  └── Admin / HR
       └── Admin Dashboard
            ├── Employees
            ├── Attendance
            ├── Leave Approval
            └── Payroll Control
```

---

# 3.1 Authentication & Authorization

## 3.1.1 Sign Up

### Required fields

- Employee ID
- Email
- Password
- Role: Employee / HR

### UI

```
Sign Up
├── Employee ID
├── Email
├── Password
├── Role
└── Create Account
```

### Workflow

```
Open Sign Up
  ↓
Enter details
  ↓
Client-side validation
  ↓
Submit
  ↓
Authentication/backend request
  ↓
Success or error state
  ↓
Email verification
```

### Frontend validation

- Required fields
- Valid email format
- Password rules exposed by the application
- Role selection

Email verification and password enforcement must ultimately be handled
by the authentication/backend layer.

### Useful frontend additions

- Password visibility toggle
- Loading state
- Disabled submit button while submitting
- Inline validation messages
- Clear success/error feedback

---

## 3.1.2 Sign In

### UI

```
Sign In
├── Email
├── Password
└── Sign In
```

### Workflow

```
Enter credentials
  ↓
Submit
  ↓
Authentication
  ├── Success → Dashboard
  └── Failure → Error message
```

### Useful frontend additions

- Loading state
- Password visibility toggle
- Clear invalid-credential message
- Role-based redirect
- Disabled button during request

---

# 3.2 Dashboard

## 3.2.1 Employee Dashboard

Required quick-access cards:

- Profile
- Attendance
- Leave Requests
- Logout

Also show recent activity or alerts.

### Workflow

```
Employee Login
  ↓
Employee Dashboard
  ├── Profile
  ├── Attendance
  ├── Leave Requests
  └── Logout
```

### Useful frontend additions

- Attendance summary card
- Pending leave count
- Recent activity
- Alerts
- Quick-action buttons

---

## 3.2.2 Admin / HR Dashboard

Required:

- Employee list
- Attendance records
- Leave approvals
- Ability to switch between employees

### Workflow

```
Admin Login
  ↓
Admin Dashboard
  ↓
Employee List
  ↓
Select Employee
  ↓
View relevant records
```

### Useful frontend additions

- Employee search
- Filters
- Status badges
- Pending-approval counter
- Summary cards
- Quick navigation

---

# 3.3 Employee Profile Management

## 3.3.1 View Profile

Employees can view:

- Personal details
- Job details
- Salary structure
- Documents
- Profile picture

### Suggested layout

```
Profile
├── Profile Picture / Name
├── Personal Details
├── Job Details
├── Salary Structure
└── Documents
```

---

## 3.3.2 Edit Profile

### Employee

Employees can edit only:

- Address
- Phone
- Profile picture

### Admin

Admin can edit all employee details.

### Workflow

```
Profile
  ↓
Edit
  ↓
Check role
  ├── Employee → limited fields
  └── Admin → all permitted fields
  ↓
Save
```

### Useful frontend additions

- View/Edit mode
- Image preview
- Form validation
- Cancel button
- Save success message
- Error state
- Unsaved-changes warning

---

# 3.4 Attendance Management

## 3.4.1 Attendance Tracking

Required:

- Daily attendance view
- Weekly attendance view
- Employee check-in
- Employee check-out

Statuses:

- Present
- Absent
- Half-day
- Leave

### Employee workflow

```
Attendance
  ↓
Today's record
  ↓
Check In
  ↓
Present
  ↓
Check Out
  ↓
Attendance completed
```

### Weekly view

```
Monday      Present
Tuesday     Present
Wednesday   Leave
Thursday    Half-day
Friday      Present
```

---

## 3.4.2 Attendance View Permissions

```
Employee
  ↓
Own attendance only
```

```
Admin / HR
  ↓
Attendance of all employees
```

### Useful frontend additions

- Daily/weekly toggle
- Date navigation
- Check-in time
- Check-out time
- Working-hours display
- Attendance summary
- Admin employee filter
- Status badges

---

# 3.5 Leave & Time-Off Management

## 3.5.1 Apply for Leave

Required leave types:

- Paid
- Sick
- Unpaid

Required information:

- Leave type
- Date range
- Remarks

Request statuses:

- Pending
- Approved
- Rejected

### Employee workflow

```
Apply for Leave
  ↓
Select leave type
  ↓
Select start/end date
  ↓
Add remarks
  ↓
Submit
  ↓
Pending
  ↓
Admin / HR review
  ↓
Approved / Rejected
```

---

## 3.5.2 Leave Approval

Admin can:

- View all leave requests
- Approve
- Reject
- Add comments

### Workflow

```
Admin Dashboard
  ↓
Leave Requests
  ↓
Review request
  ├── Approve → Approved
  └── Reject → Rejected
```

Changes should be reflected in the employee record after a successful
update.

### Useful frontend additions

- Status badges
- Filter by status
- Filter by employee
- Pending-request counter
- Confirmation before approval/rejection
- Admin comments
- Loading state
- Empty state
- Error state

---

# 3.6 Payroll / Salary Management

## 3.6.1 Employee Payroll View

Payroll data is **read-only for employees**.

### Suggested UI

```
Employee Payroll
├── Employee Name
├── Employee ID
├── Pay Period
├── Basic Salary
├── Allowances
├── Deductions
└── Net Salary
```

### Workflow

```
Employee
  ↓
Payroll
  ↓
View salary information
  ↓
No editing controls
```

---

## 3.6.2 Admin Payroll Control

Admin can:

- View payroll of all employees
- Update salary structure
- Ensure payroll accuracy

### Suggested UI

```
Admin Payroll Control
├── Employee List
├── Salary Structure
│   ├── Basic Salary
│   ├── Allowances
│   ├── Deductions
│   └── Net Salary
└── Save Changes
```

### Workflow

```
Admin
  ↓
Payroll Control
  ↓
Employee List
  ↓
Select employee
  ↓
Edit salary structure
  ↓
Calculate/review net salary
  ↓
Save
```

### Frontend prototype calculation

```
Net Salary = Basic Salary + Allowances - Deductions
```

Example:

```
₹40,000 + ₹8,000 - ₹3,000 = ₹45,000
```

### Useful frontend additions

- Automatic net-salary calculation
- Currency formatting
- Employee search
- Employee filtering
- Salary validation
- Save confirmation
- Read-only employee view
- Clear admin edit mode

The frontend calculation is only a UI/business-rule prototype. Final
payroll accuracy must be validated by the backend.

---

# 4. Role-Based Frontend Experience

## Employee

```
Dashboard
├── Profile
│   └── Limited editing
├── Attendance
│   └── Own records
├── Leave
│   ├── Apply
│   └── View own requests
└── Payroll
    └── Read-only
```

## Admin / HR

```
Dashboard
├── Employees
├── Attendance
│   └── All employees
├── Leave
│   └── Approve / Reject
└── Payroll
    ├── View all
    └── Update salary structure
```

---

# 5. React + TypeScript Component Strategy

Prefer reusable components instead of putting every feature into one
large component.
Example:

```
app/
├── page.tsx
├── dashboard/
│   └── page.tsx
├── attendance/
│   └── page.tsx
├── leave/
│   └── page.tsx
├── payroll/
│   └── page.tsx
├── profile/
│   └── page.tsx
└── components/
    ├── Navbar.tsx
    ├── Sidebar.tsx
    ├── Card.tsx
    ├── StatusBadge.tsx
    ├── Button.tsx
    ├── EmployeeTable.tsx
    └── Modal.tsx
```

The exact folder structure can evolve as the project grows.

---

# 6. Important Frontend State

React state will be needed for:

- Authentication state
- User role
- Attendance status
- Check-in/check-out time
- Leave form values
- Leave request status
- Selected employee
- Payroll values
- Loading state
- Error state
- Success state

Small local interactions can use `useState`. Shared application state
can be introduced later if the application requires it.

---

# 7. Forms & Validation

Major forms:

### Authentication

```
Employee ID
Email
Password
Role
```

### Profile

```
Address
Phone
Profile Picture
```

### Leave

```
Leave Type
Start Date
End Date
Remarks
```

### Payroll

```
Basic Salary
Allowances
Deductions
```

Provide immediate, understandable validation feedback.

---

# 8. Loading, Error & Empty States

Data-driven UI should handle:

### Loading

```
Loading employee records...
```

### Error

```
Unable to load employee records.
Please try again.
```

### Empty

```
No leave requests found.
```

This is important when converting the prototype into a real application.

---

# 9. Navigation Workflow

```
Login
  ↓
Dashboard
  ├── Employee
  │    ├── Profile
  │    ├── Attendance
  │    ├── Leave
  │    └── Payroll
  │
  └── Admin / HR
       ├── Employees
       ├── Attendance
       ├── Leave
       └── Payroll
```

---

# 10. Frontend Security Boundary

Hiding an Admin button from an Employee is **not real authorization**.
Correct architecture:

```
Frontend
  ↓
Role-aware UI
  ↓
Backend
  ↓
Actual authorization
  ↓
Database
```

The backend must verify permissions for: - Employee data - Attendance
records - Leave approvals - Payroll data - Salary updates

---

# 11. Responsive Design

The UI should work across:

- Desktop
- Laptop
- Tablet
- Mobile

Pay special attention to:

- Dashboard cards
- Tables
- Forms
- Navigation
- Profile pages
- Attendance views
- Leave forms
- Payroll tables

For narrow screens, large tables should use horizontal scrolling or a
mobile-specific layout.

---

# 12. UI/UX Consistency

Use a consistent design language across all modules:

- Typography
- Buttons
- Cards
- Border radius
- Spacing
- Forms
- Status badges
- Navigation

Suggested status semantics:

```
Present   → Success
Approved  → Success
Pending   → Warning
Half-day  → Warning
Rejected  → Error
Absent    → Error
Leave     → Informational / Neutral
```

---

# 13. End-to-End Employee Workflow

```
Sign Up
  ↓
Email Verification
  ↓
Sign In
  ↓
Employee Dashboard
  ↓
View / Edit Profile
  ↓
Check In
  ↓
View Attendance
  ↓
Apply for Leave
  ↓
Wait for Approval
  ↓
View Leave Status
  ↓
View Payroll
  ↓
Logout
```

---

# 14. End-to-End Admin / HR Workflow

```
Sign In
  ↓
Admin Dashboard
  ↓
View Employees
  ↓
Select Employee
  ↓
Manage Employee Information
  ↓
View Attendance
  ↓
Review Leave Requests
  ↓
Approve / Reject
  ↓
View Payroll
  ↓
Update Salary Structure
  ↓
Review Payroll Accuracy
  ↓
Save Changes
```

---

# 15. Frontend Value Additions

These are enhancements to improve usability beyond the minimum
functional requirements:
Module           Suggested addition

---

Authentication   Loading states, password visibility, clear errors
Dashboard        Summary cards, alerts, quick actions
Profile          Image preview, edit mode, unsaved-change warning
Attendance       Daily/weekly toggle, working hours, filters
Leave            Status filters, confirmation dialogs, pending count
Payroll          Automatic calculation, currency formatting, validation
Admin            Search, employee filters, status indicators
Global UI        Responsive layout, loading/error/empty states
Navigation       Role-aware navigation
UX               Reusable components and consistent feedback
These are **frontend value additions**, not replacements for the stated
functional requirements.

---

# 16. Recommended Implementation Order

```
3.1 Authentication
        ↓
3.2 Dashboard
        ↓
3.3 Profile
        ↓
3.4 Attendance
        ↓
3.5 Leave & Time-Off
        ↓
3.6 Payroll
        ↓
Shared navigation/components
        ↓
Validation + loading/error/empty states
        ↓
Backend integration
```

For each feature:

```
HTML prototype
  ↓
CSS
  ↓
JavaScript
  ↓
React
  ↓
TypeScript
  ↓
Tailwind
  ↓
Backend integration
```

---

# 17. Completion Checklist

## 3.1 Authentication & Authorization

- Sign Up
- Sign In
- Email verification state
- Validation
- Role selection
- Authentication errors
- Role-based redirect

## 3.2 Dashboard

- Employee dashboard
- Admin/HR dashboard
- Quick-access cards
- Recent activity
- Alerts
- Employee list
- Employee switching

## 3.3 Profile

- Personal details
- Job details
- Salary structure
- Documents
- Profile picture
- Employee limited editing
- Admin full editing

## 3.4 Attendance

- Daily view
- Weekly view
- Check-in
- Check-out
- Present
- Absent
- Half-day
- Leave
- Employee own-record view
- Admin all-record view

## 3.5 Leave

- Leave type
- Date range
- Remarks
- Submit request
- Pending
- Approved
- Rejected
- Admin request list
- Approve
- Reject
- Admin comments

## 3.6 Payroll

- Employee payroll view
- Read-only employee payroll
- Admin payroll list
- Salary structure editing
- Net salary calculation
- Save changes
- Payroll validation

---

# 18. Future Enhancements

The specification identifies:

- Email alerts
- Notification alerts
- Analytics
- Reports
- Salary slips
- Attendance reports

Possible frontend expansion:

```
Reports
├── Attendance Report
├── Leave Report
├── Payroll Report
└── Salary Slip
```

---

# 19. Final Frontend Architecture

```
                    DAYFLOW HRMS
                         │
          ┌──────────────┴──────────────┐
          │                             │
       Employee                      Admin / HR
          │                             │
      Dashboard                     Dashboard
          │                             │
   ┌──────┼──────┬──────┐       ┌──────┼──────────────┐
   │      │      │      │       │      │       │      │
Profile Attendance Leave Payroll Employees Attendance Leave Payroll
   │      │      │      │       │      │       │      │
   └──────┴──────┴──────┘       └──────┴───────┴──────┘
                         │
                         ▼
                 Backend / Database
```

## Final Goal

The frontend should clearly separate the **Employee experience** from
the **Admin/HR experience** while remaining:

- Simple
- Responsive
- Consistent
- Role-aware
- Interactive
- Easy to navigate

The prototype proves the workflows first. React + TypeScript then
provides the maintainable application structure, while backend
integration provides persistent data, real authentication,
authorization, and final business-rule enforcement.