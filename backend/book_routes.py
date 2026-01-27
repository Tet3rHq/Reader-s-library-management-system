from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import Book, User, BorrowRecord
from sqlalchemy import or_
import os
import time
from werkzeug.utils import secure_filename

books_bp = Blueprint('books', __name__, url_prefix='/api/books')

# Configuration for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'covers')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def require_admin():
    """Decorator to check if user is admin."""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return None


@books_bp.route('', methods=['GET'])
def get_books():
    """Get all books with optional search and filtering."""
    try:
        # Get query parameters
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        author = request.args.get('author', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = Book.query
        
        # Apply search filter
        if search:
            search_filter = or_(
                Book.title.ilike(f'%{search}%'),
                Book.author.ilike(f'%{search}%'),
                Book.isbn.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply category filter
        if category:
            query = query.filter(Book.category.ilike(f'%{category}%'))
        
        # Apply author filter
        if author:
            query = query.filter(Book.author.ilike(f'%{author}%'))
        
        # Paginate results
        pagination = query.order_by(Book.title).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'books': [book.to_dict() for book in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get a specific book by ID."""
    try:
        book = Book.query.get(book_id)
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        return jsonify({'book': book.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@books_bp.route('', methods=['POST'])
@jwt_required()
def create_book():
    """Create a new book (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        # Check if this is multipart/form-data (file upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            cover_file = request.files.get('cover_image')
        else:
            data = request.get_json()
            cover_file = None
        
        # Validate required fields
        required_fields = ['title', 'author', 'isbn', 'category', 'year', 'total_copies']
        if not data or not all(k in data for k in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate ISBN length
        isbn = data['isbn'].strip()
        if len(isbn) > 50:
            return jsonify({'error': 'ISBN must not exceed 50 characters'}), 400
        
        # Check if ISBN already exists
        if Book.query.filter_by(isbn=data['isbn']).first():
            return jsonify({'error': 'Book with this ISBN already exists'}), 400
        
        # Validate year
        try:
            year = int(data['year'])
            if year < 1000 or year > 9999:
                return jsonify({'error': 'Invalid year'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid year format'}), 400
        
        # Validate copies
        try:
            total_copies = int(data['total_copies'])
            if total_copies < 1:
                return jsonify({'error': 'Total copies must be at least 1'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid total copies format'}), 400
        
        # Handle cover image upload
        cover_filename = None
        if cover_file and cover_file.filename:
            if allowed_file(cover_file.filename):
                # Create a unique filename
                filename = secure_filename(cover_file.filename)
                # Add timestamp to make it unique
                unique_filename = f"{int(time.time())}_{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                cover_file.save(filepath)
                cover_filename = unique_filename
            else:
                return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400
        
        # Create new book
        book = Book(
            title=data['title'].strip(),
            author=data['author'].strip(),
            isbn=data['isbn'].strip(),
            category=data['category'].strip(),
            year=year,
            total_copies=total_copies,
            available_copies=total_copies,
            description=data.get('description', '').strip(),
            cover_image=cover_filename
        )
        
        db.session.add(book)
        db.session.commit()
        
        return jsonify({
            'message': 'Book created successfully',
            'book': book.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@books_bp.route('/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    """Update a book (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        book = Book.query.get(book_id)
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        # Check if this is multipart/form-data (file upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            cover_file = request.files.get('cover_image')
        else:
            data = request.get_json()
            cover_file = None
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        if 'title' in data:
            book.title = data['title'].strip()
        
        if 'author' in data:
            book.author = data['author'].strip()
        
        if 'isbn' in data:
            new_isbn = data['isbn'].strip()
            # Validate ISBN length
            if len(new_isbn) > 50:
                return jsonify({'error': 'ISBN must not exceed 50 characters'}), 400
            # Check if new ISBN already exists (excluding current book)
            existing = Book.query.filter(Book.isbn == new_isbn, Book.id != book_id).first()
            if existing:
                return jsonify({'error': 'Book with this ISBN already exists'}), 400
            book.isbn = new_isbn
        
        if 'category' in data:
            book.category = data['category'].strip()
        
        if 'year' in data:
            try:
                year = int(data['year'])
                if year < 1000 or year > 9999:
                    return jsonify({'error': 'Invalid year'}), 400
                book.year = year
            except ValueError:
                return jsonify({'error': 'Invalid year format'}), 400
        
        if 'total_copies' in data:
            try:
                total_copies = int(data['total_copies'])
                if total_copies < 1:
                    return jsonify({'error': 'Total copies must be at least 1'}), 400
                # Update available copies proportionally
                difference = total_copies - book.total_copies
                book.available_copies = max(0, book.available_copies + difference)
                book.total_copies = total_copies
            except ValueError:
                return jsonify({'error': 'Invalid total copies format'}), 400
        
        if 'description' in data:
            book.description = data['description'].strip()
        
        # Handle cover image upload
        if cover_file and cover_file.filename:
            if allowed_file(cover_file.filename):
                # Delete old cover image if exists
                if book.cover_image:
                    old_filepath = os.path.join(UPLOAD_FOLDER, book.cover_image)
                    if os.path.exists(old_filepath):
                        os.remove(old_filepath)
                
                # Save new cover image
                filename = secure_filename(cover_file.filename)
                unique_filename = f"{int(time.time())}_{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                cover_file.save(filepath)
                book.cover_image = unique_filename
            else:
                return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Book updated successfully',
            'book': book.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@books_bp.route('/<int:book_id>', methods=['DELETE'])
@jwt_required()
def delete_book(book_id):
    """Delete a book (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        book = Book.query.get(book_id)
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        # Check if book has active borrow records (borrowed, pending, or pending_return)
        active_borrows = book.borrow_records.filter(
            BorrowRecord.status.in_(['borrowed', 'pending', 'pending_return', 'overdue'])
        ).count()
        if active_borrows > 0:
            return jsonify({'error': 'Cannot delete book with active borrow records or pending requests'}), 400
        
        db.session.delete(book)
        db.session.commit()
        
        return jsonify({'message': 'Book deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@books_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all unique book categories."""
    try:
        categories = db.session.query(Book.category).distinct().order_by(Book.category).all()
        return jsonify({
            'categories': [cat[0] for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
