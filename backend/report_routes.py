from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from models import BorrowRecord, Book, User
from sqlalchemy import func, desc
from datetime import datetime, timedelta, timezone

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


def require_admin():
    """Check if current user is admin."""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return None


@reports_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get system overview statistics (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        # Total counts
        total_books = Book.query.count()
        total_users = User.query.count()
        total_borrows = BorrowRecord.query.count()
        
        # Active borrows
        active_borrows = BorrowRecord.query.filter_by(status='borrowed').count()
        
        # Overdue books
        overdue_count = BorrowRecord.query.filter(
            BorrowRecord.status == 'borrowed',
            BorrowRecord.due_date < datetime.now(timezone.utc)
        ).count()
        
        # Available books
        available_books = db.session.query(func.sum(Book.available_copies)).scalar() or 0
        total_copies = db.session.query(func.sum(Book.total_copies)).scalar() or 0
        
        return jsonify({
            'total_books': total_books,
            'total_users': total_users,
            'total_borrows': total_borrows,
            'active_borrows': active_borrows,
            'overdue_count': overdue_count,
            'available_books': available_books,
            'total_copies': total_copies
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/most-borrowed', methods=['GET'])
@jwt_required()
def get_most_borrowed_books():
    """Get most borrowed books (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        limit = request.args.get('limit', 10, type=int)
        
        # Query to get most borrowed books
        most_borrowed = db.session.query(
            Book,
            func.count(BorrowRecord.id).label('borrow_count')
        ).join(
            BorrowRecord, Book.id == BorrowRecord.book_id
        ).group_by(
            Book.id
        ).order_by(
            desc('borrow_count')
        ).limit(limit).all()
        
        result = []
        for book, count in most_borrowed:
            book_dict = book.to_dict()
            book_dict['borrow_count'] = count
            result.append(book_dict)
        
        return jsonify({
            'most_borrowed_books': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/borrowing-history', methods=['GET'])
@jwt_required()
def get_borrowing_history():
    """Get borrowing history with optional filters (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        # Get query parameters
        user_id = request.args.get('user_id', type=int)
        book_id = request.args.get('book_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = BorrowRecord.query
        
        # Apply filters
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if book_id:
            query = query.filter_by(book_id=book_id)
        
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(BorrowRecord.borrow_date >= start)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format'}), 400
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(BorrowRecord.borrow_date <= end)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format'}), 400
        
        # Paginate results
        pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'history': [record.to_dict() for record in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/user-activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    """Get user activity statistics (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        limit = request.args.get('limit', 10, type=int)
        
        # Query to get most active users
        most_active = db.session.query(
            User,
            func.count(BorrowRecord.id).label('borrow_count')
        ).join(
            BorrowRecord, User.id == BorrowRecord.user_id
        ).group_by(
            User.id
        ).order_by(
            desc('borrow_count')
        ).limit(limit).all()
        
        result = []
        for user, count in most_active:
            user_dict = user.to_dict()
            user_dict['borrow_count'] = count
            result.append(user_dict)
        
        return jsonify({
            'most_active_users': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_borrowing_trends():
    """Get borrowing trends over time (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        days = request.args.get('days', 30, type=int)
        
        # Calculate start date
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Query borrowing data grouped by date
        trends = db.session.query(
            func.date(BorrowRecord.borrow_date).label('date'),
            func.count(BorrowRecord.id).label('count')
        ).filter(
            BorrowRecord.borrow_date >= start_date
        ).group_by(
            func.date(BorrowRecord.borrow_date)
        ).order_by(
            func.date(BorrowRecord.borrow_date)
        ).all()
        
        result = []
        for date, count in trends:
            result.append({
                'date': date.isoformat() if date else None,
                'count': count
            })
        
        return jsonify({
            'trends': result,
            'days': days
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/category-distribution', methods=['GET'])
@jwt_required()
def get_category_distribution():
    """Get book distribution by category (Admin only)."""
    # Check admin role
    error_response = require_admin()
    if error_response:
        return error_response
    
    try:
        # Query book count by category
        distribution = db.session.query(
            Book.category,
            func.count(Book.id).label('count'),
            func.sum(Book.total_copies).label('total_copies')
        ).group_by(
            Book.category
        ).order_by(
            desc('count')
        ).all()
        
        result = []
        for category, count, total_copies in distribution:
            result.append({
                'category': category,
                'book_count': count,
                'total_copies': total_copies
            })
        
        return jsonify({
            'distribution': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
