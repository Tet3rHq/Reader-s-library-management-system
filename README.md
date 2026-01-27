# Library Management System

A full-stack web-based Library Management System built with React (TypeScript) frontend and Flask (Python) backend. This system allows users to search, borrow, and return books, while administrators can manage books, users, and generate reports.

## Features

### User Features
- Browse and search books by title, author, ISBN, or category
- View book availability in real-time
- Borrow available books with automatic due date tracking
- Return borrowed books
- View borrowing history
- Track overdue books
- Personal dashboard with statistics

### Admin Features
- All user features, plus:
- Complete book management (Add, Edit, Delete)
- View all borrow records across the system
- Approved student borrowing book request
- Verify student return the borrowed book
- Generate comprehensive reports
- Track overdue books system-wide
- Manage user accounts and permissions

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite build tool
- React Router v6
- Axios with cookie support
- Custom CSS with responsive design

### Backend
- Flask 3.0
- PostgreSQL with Flask-SQLAlchemy
- Flask-JWT-Extended (Cookie-based authentication)
- bcrypt for password hashing
- Flask-Migrate for database migrations

### Security
- HTTP-only cookies for JWT tokens
- CSRF protection
- Password hashing with bcrypt
- Role-based access control
- Secure session management

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python init_db.py
python app.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Admin Credentials

**Admin**: `kca-library` (email: library@kcau.ac.ke)
- Password is set from the `ADMIN_PASSWORD` environment variable during backend initialization (default: KcaLibrary@2024)

> Note: All user signups create normal users. The admin account is created automatically during backend initialization.

## Project Structure

```
library-management-system/
├── backend/          # Flask backend
│   ├── app.py
│   ├── models.py
│   ├── *_routes.py
│   └── README.md
├── frontend/         # React frontend
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   └── README.md
└── README.md
```

## Documentation

- Backend documentation: `backend/README.md`
- Frontend documentation: `frontend/README.md`

## License

MIT License - Final year university project
