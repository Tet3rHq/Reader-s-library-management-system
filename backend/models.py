from datetime import datetime, timezone
from extensions import db
import bcrypt


def get_utc_now():
    """Helper function to get current UTC time with timezone info."""
    return datetime.now(timezone.utc)


class User(db.Model):
    """User model for authentication and user management."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, nullable=False, default=get_utc_now)
    
    # Relationships
    borrow_records = db.relationship('BorrowRecord', back_populates='user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
    
    def check_password(self, password):
        """Verify the user's password."""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Book(db.Model):
    """Book model for library inventory."""
    
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    author = db.Column(db.String(200), nullable=False, index=True)
    isbn = db.Column(db.String(50), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    year = db.Column(db.Integer, nullable=False)
    total_copies = db.Column(db.Integer, nullable=False, default=1)
    available_copies = db.Column(db.Integer, nullable=False, default=1)
    description = db.Column(db.Text)
    cover_image = db.Column(db.String(255))  # Filename of the book cover image
    created_at = db.Column(db.DateTime, nullable=False, default=get_utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=get_utc_now, onupdate=get_utc_now)
    
    # Relationships
    borrow_records = db.relationship('BorrowRecord', back_populates='book', lazy='dynamic')
    
    def to_dict(self):
        """Convert book to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'category': self.category,
            'year': self.year,
            'total_copies': self.total_copies,
            'available_copies': self.available_copies,
            'description': self.description,
            'cover_image': self.cover_image,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class BorrowRecord(db.Model):
    """Borrow record model for tracking book borrowing."""
    
    __tablename__ = 'borrow_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False, index=True)
    borrow_date = db.Column(db.DateTime, nullable=False, default=get_utc_now)
    due_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'borrowed', 'pending_return', 'returned', 'overdue', 'rejected'
    created_at = db.Column(db.DateTime, nullable=False, default=get_utc_now)
    
    # Relationships
    user = db.relationship('User', back_populates='borrow_records')
    book = db.relationship('Book', back_populates='borrow_records')
    
    def to_dict(self):
        """Convert borrow record to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'book_id': self.book_id,
            'user': self.user.to_dict() if self.user else None,
            'book': self.book.to_dict() if self.book else None,
            'borrow_date': self.borrow_date.isoformat() if self.borrow_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def is_overdue(self):
        """Check if the borrow record is overdue."""
        if self.status == 'returned':
            return False
        # Make due_date timezone-aware if it's naive (for SQLite compatibility)
        due_date = self.due_date
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > due_date
