# HR Management Portal

A modern, full-stack HR management system built with React (Vite) and Django REST Framework.

## Project Structure

- `backend/`: Django REST Framework API.
- `hr-management-portal/`: React Single Page Application (frontend).

## Features

- **Authentication**: JWT-based login, auto-refresh, and role-based access control (Admin, HR, Employee).
- **Attendance**: Clock-in / clock-out tracking, daily logs.
- **Leave Management**: Leave requests, approvals, and balances.
- **Payroll**: Salary structures, payslip generation, and viewing.
- **Organization Structure**: Multi-tenant support allowing admins to register their organizations and invite employees.

## Getting Started

### Backend Setup

1. Navigate to the `backend/` directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file (see `.env.example` if available).
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the `hr-management-portal/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in `.env` based on `.env.example`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation
Once the backend is running, the interactive API documentation (Swagger/OpenAPI) is available at `http://localhost:8000/api/schema/swagger-ui/` or `http://localhost:8000/api/schema/redoc/`.

## License
MIT
