# Deployment Instructions

This guide provides instructions on how to deploy the HR Management Portal to production.

## Prerequisites

- A server (e.g., Ubuntu, Debian, or Docker-based environment)
- PostgreSQL (recommended for production) instead of SQLite
- Node.js (for building frontend)
- Python 3.10+
- Nginx or Apache (for reverse proxy and serving static files)

## 1. Backend Deployment

### Setup Environment
1. Clone the repository on your server.
2. Navigate to `backend/`.
3. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn psycopg2-binary
   ```

### Configure Variables
Create a `.env` file in the `backend/` directory:
```env
SECRET_KEY=your_secure_random_secret_key
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com
DATABASE_URL=postgres://user:password@localhost:5432/hr_db
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Database & Static Files
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### Run with Gunicorn
Use a process manager like `systemd` or `supervisor` to run Gunicorn:
```bash
gunicorn backend.wsgi:application --bind 127.0.0.1:8000 --workers 3
```

## 2. Frontend Deployment

### Build the App
1. Navigate to `hr-management-portal/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set the `.env.production` file:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api/v1/
   ```
4. Build the static files:
   ```bash
   npm run build
   ```
This will generate a `dist/` directory containing the optimized production build.

## 3. Web Server Configuration (Nginx)

Example Nginx configuration to serve both the frontend and proxy the backend API:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve Frontend
    location / {
        root /path/to/hr-management-portal/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve Backend Static Files (Admin, Rest Framework)
    location /static/ {
        alias /path/to/backend/staticfiles/;
    }
}
```

Enable the site in Nginx and reload the service:
```bash
sudo systemctl reload nginx
```

## 4. HTTPS (SSL)
It is highly recommended to use Let's Encrypt / Certbot to secure your application:
```bash
sudo certbot --nginx -d yourdomain.com
```
