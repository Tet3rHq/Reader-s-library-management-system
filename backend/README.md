# Library Management System - Backend

Flask-based RESTful API for the Library Management System with PostgreSQL database and JWT cookie-based authentication.

## Features

- **User Authentication**: Secure cookie-based JWT authentication
- **Role-Based Access Control**: Admin and User roles with different permissions
- **Book Management**: Full CRUD operations for books (Admin only)
- **Search & Browse**: Search books by title, author, ISBN, or category
- **Borrow & Return System**: Users can borrow and return books with automatic overdue detection
- **Reports & Analytics**: Comprehensive reporting system (Admin only)
- **Security**: Password hashing with bcrypt, CSRF protection, HTTP-only cookies

## Tech Stack

- **Framework**: Flask 3.0.0
- **Database**: PostgreSQL with Flask-SQLAlchemy
- **Authentication**: Flask-JWT-Extended with cookie support
- **Password Hashing**: bcrypt
- **CORS**: Flask-CORS
- **Migrations**: Flask-Migrate

## Project Structure

```
backend/
├── app.py                 # Main application factory
├── config.py              # Configuration settings
├── extensions.py          # Flask extensions initialization
├── models.py              # Database models (User, Book, BorrowRecord)
├── auth_routes.py         # Authentication endpoints
├── book_routes.py         # Book management endpoints
├── borrow_routes.py       # Borrow/return endpoints
├── report_routes.py       # Reports and analytics endpoints
├── init_db.py             # Database initialization and seeding script
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)

## Installation

### 1. Clone the repository

```bash
cd backend
```

### 2. Create a virtual environment

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up PostgreSQL database

Create a PostgreSQL database:

```sql
CREATE DATABASE library_db;
CREATE USER library_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;
```

### 5. Configure environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://library_user:your_password@localhost:5432/library_db
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
ADMIN_PASSWORD=your-secure-admin-password-here
```

### 6. Initialize the database

```bash
python init_db.py
```

This will create all tables and seed the database with:
- Admin user: `kca-library` (email: library@kcau.ac.ke)
  - Password is set from `ADMIN_PASSWORD` environment variable (default: KcaLibrary@2024)
- 10 sample books

> Note: All user signups through the API create normal users only. The admin account is created during database initialization.

## Running the Application

### Development mode

```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Using Flask CLI

```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

> Note: All registrations create normal users. Admin accounts cannot be created through signup.

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "kca-library",
  "password": "KcaLibrary@2024"
}
```

Response sets HTTP-only cookie with JWT token.

#### Logout
```http
POST /api/auth/logout
```

Requires authentication cookie.

#### Get current user
```http
GET /api/auth/me
```

#### Check authentication status
```http
GET /api/auth/check
```

### Book Endpoints

#### Get all books (with search and filtering)
```http
GET /api/books?search=clean&category=Technology&page=1&per_page=20
```

#### Get a specific book
```http
GET /api/books/:id
```

#### Create a book (Admin only)
```http
POST /api/books
Content-Type: application/json

{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "978-0-13-235088-4",
  "category": "Technology",
  "year": 2008,
  "total_copies": 5,
  "description": "A handbook of agile software craftsmanship."
}
```

#### Update a book (Admin only)
```http
PUT /api/books/:id
Content-Type: application/json

{
  "total_copies": 10
}
```

#### Delete a book (Admin only)
```http
DELETE /api/books/:id
```

#### Get all categories
```http
GET /api/books/categories
```

### Borrow Endpoints

#### Borrow a book
```http
POST /api/borrow
Content-Type: application/json

{
  "book_id": 1
}
```

#### Return a book
```http
POST /api/borrow/:record_id/return
```

#### Get my borrow records
```http
GET /api/borrow/my-borrows?status=borrowed&page=1&per_page=20
```

#### Get all borrow records (Admin only)
```http
GET /api/borrow/all?status=borrowed&user_id=1&book_id=2
```

#### Get overdue records (Admin only)
```http
GET /api/borrow/overdue
```

### Report Endpoints (Admin only)

#### Get system overview
```http
GET /api/reports/overview
```

#### Get most borrowed books
```http
GET /api/reports/most-borrowed?limit=10
```

#### Get borrowing history
```http
GET /api/reports/borrowing-history?user_id=1&start_date=2024-01-01
```

#### Get user activity
```http
GET /api/reports/user-activity?limit=10
```

#### Get borrowing trends
```http
GET /api/reports/trends?days=30
```

#### Get category distribution
```http
GET /api/reports/category-distribution
```

## Authentication Flow

1. User sends credentials to `/api/auth/login`
2. Server validates credentials and creates JWT token
3. Server sets HTTP-only cookie with JWT token
4. Client includes cookie in subsequent requests automatically
5. Server validates JWT from cookie on protected routes
6. User can logout via `/api/auth/logout` which clears the cookie

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **HTTP-only Cookies**: JWT tokens stored in HTTP-only cookies (not accessible via JavaScript)
- **CSRF Protection**: CSRF tokens for state-changing operations
- **CORS**: Configured to allow specific origins with credentials
- **Input Validation**: All inputs are validated before processing
- **Role-Based Access**: Admin-only routes are protected

## Database Models

### User
- id (Primary Key)
- username (Unique)
- email (Unique)
- password_hash
- role (admin/user)
- created_at

### Book
- id (Primary Key)
- title
- author
- isbn (Unique)
- category
- year
- total_copies
- available_copies
- description
- created_at
- updated_at

### BorrowRecord
- id (Primary Key)
- user_id (Foreign Key -> User)
- book_id (Foreign Key -> Book)
- borrow_date
- due_date (14 days from borrow)
- return_date
- status (borrowed/returned/overdue)
- created_at

## Error Handling

All endpoints return JSON responses with appropriate HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Testing

You can test the API using:
- **Postman**: Import the endpoints and test with cookie support enabled
- **cURL**: Use `-c` and `-b` flags for cookie handling
- **HTTPie**: Use `--session` flag for cookie persistence

Example with cURL:
```bash
# Login and save cookies
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kca-library","password":"KcaLibrary@2024"}' \
  -c cookies.txt

# Use cookies for authenticated requests
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

## Development Tips

1. **Database Migrations**: Use Flask-Migrate for schema changes
   ```bash
   flask db init
   flask db migrate -m "Description"
   flask db upgrade
   ```

2. **Reset Database**: Re-run `init_db.py` to reset and reseed

3. **Debug Mode**: Set `FLASK_ENV=development` for detailed error messages

4. **CORS Issues**: Update `FRONTEND_URL` in `.env` to match your frontend URL

## Production Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Use strong random values for `SECRET_KEY` and `JWT_SECRET_KEY`
3. Set `JWT_COOKIE_SECURE=True` to require HTTPS
4. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
5. Configure PostgreSQL with proper security settings
6. Use environment variables for all sensitive configuration
7. Enable HTTPS/SSL certificates
8. Set up proper database backups

## License

MIT License - feel free to use this for your final year project.

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.
