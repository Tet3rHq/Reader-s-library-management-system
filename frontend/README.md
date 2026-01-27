# Library Management System - Frontend

React + TypeScript frontend application with cookie-based authentication and role-based access control.

## Features

- **Modern Stack**: React 18 + TypeScript + Vite
- **Cookie-Based Authentication**: Secure HTTP-only cookies for JWT storage
- **Role-Based UI**: Different interfaces for Admin and Regular Users
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Book Management**: Browse, search, and filter books
- **Borrow System**: Users can borrow and return books
- **Admin Dashboard**: System statistics and management tools
- **Protected Routes**: Automatic redirects based on authentication state

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS with responsive design
- **State Management**: React Context API

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Backend API running on `http://localhost:5000`

## Installation

```bash
cd frontend
npm install
```

## Running the Application

### Development mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Demo Credentials

- **Admin**: `admin` / `Admin@123`
- **User**: `user` / `User@123`

## Pages

- `/login` - User login
- `/register` - New user registration
- `/dashboard` - User dashboard
- `/books` - Browse and search books
- `/my-borrows` - View borrowed books
- `/admin/dashboard` - Admin dashboard (Admin only)
- `/admin/books` - Manage books (Admin only)
- `/admin/borrows` - View all borrows (Admin only)
- `/admin/reports` - System reports (Admin only)

## License

MIT License - Final year university project.
