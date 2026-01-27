from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import BorrowRecord, Book, User
from datetime import datetime, timedelta, timezone

borrow_bp = Blueprint('borrow', __name__, url_prefix='/api/borrow')


def is_admin():
    """Check if current user is admin."""
    claims = get_jwt()
    return claims.get('role') == 'admin'


@borrow_bp.route('', methods=['POST'])
@jwt_required()
def borrow_book():
    """Request to borrow a book (pending admin approval)."""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate required fields
        if not data or 'book_id' not in data:
            return jsonify({'error': 'Missing book_id'}), 400
        
        book_id = data['book_id']
        
        # Get book
        book = Book.query.get(book_id)
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        # Check if book is available
        if book.available_copies <= 0:
            return jsonify({'error': 'Book is not available'}), 400
        
        # Check if user already has this book borrowed or pending
        active_borrow = BorrowRecord.query.filter_by(
            user_id=user_id,
            book_id=book_id
        ).filter(BorrowRecord.status.in_(['borrowed', 'pending', 'pending_return'])).first()
        
        if active_borrow:
            return jsonify({'error': 'You have already borrowed this book or have a pending request'}), 400
        
        # Check if user has too many overdue books (max 3 overdue books)
        # Use naive datetime for SQLite compatibility
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        overdue_count = BorrowRecord.query.filter(
            BorrowRecord.user_id == user_id,
            BorrowRecord.status.in_(['borrowed', 'overdue']),
            BorrowRecord.due_date < now_naive
        ).count()
        
        if overdue_count >= 3:
            return jsonify({'error': 'You have too many overdue books. Please return them first.'}), 400
        
        # Calculate due date (14 days from now)
        # Store as naive datetime for SQLite compatibility
        due_date = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=14)
        
        # Create borrow record with pending status
        borrow_record = BorrowRecord(
            user_id=user_id,
            book_id=book_id,
            due_date=due_date,
            status='pending'  # Changed from 'borrowed' to 'pending'
        )
        
        # Note: Do NOT decrement available_copies yet - only after admin approval
        
        db.session.add(borrow_record)
        db.session.commit()
        
        return jsonify({
            'message': 'Borrow request submitted successfully and is pending admin approval',
            'borrow_record': borrow_record.to_dict()
        }), 201
        
    except ValueError:
        return jsonify({'error': 'Invalid authentication token format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/<int:record_id>/return', methods=['POST'])
@jwt_required()
def return_book(record_id):
    """Request to return a borrowed book (pending admin verification)."""
    try:
        user_id = int(get_jwt_identity())
        
        # Get borrow record
        borrow_record = BorrowRecord.query.get(record_id)
        
        if not borrow_record:
            return jsonify({'error': 'Borrow record not found'}), 404
        
        # Check if user owns this borrow record or is admin
        if borrow_record.user_id != user_id and not is_admin():
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if already returned or pending return
        if borrow_record.status in ['returned', 'pending_return']:
            return jsonify({'error': 'Book already returned or return is pending verification'}), 400
        
        # Check if the borrow was approved
        if borrow_record.status != 'borrowed' and borrow_record.status != 'overdue':
            return jsonify({'error': 'Cannot return a book that was not borrowed'}), 400
        
        # Update borrow record to pending_return
        # Store as naive datetime for SQLite compatibility
        borrow_record.return_date = datetime.now(timezone.utc).replace(tzinfo=None)
        borrow_record.status = 'pending_return'
        
        # Note: Do NOT increment available_copies yet - only after admin verification
        
        db.session.commit()
        
        return jsonify({
            'message': 'Return request submitted successfully and is pending admin verification',
            'borrow_record': borrow_record.to_dict()
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid authentication token format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/my-borrows', methods=['GET'])
@jwt_required()
def get_my_borrows():
    """Get current user's borrow records."""
    try:
        user_id = int(get_jwt_identity())
        
        # Get query parameters
        status = request.args.get('status', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = BorrowRecord.query.filter_by(user_id=user_id)
        
        # Apply status filter
        if status:
            query = query.filter_by(status=status)
        
        # Paginate results
        pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Update overdue status
        for record in pagination.items:
            if record.status == 'borrowed' and record.is_overdue:
                record.status = 'overdue'
        
        db.session.commit()
        
        return jsonify({
            'borrow_records': [record.to_dict() for record in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid authentication token format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_borrows():
    """Get all borrow records (Admin only)."""
    # Check admin role
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get query parameters
        status = request.args.get('status', '').strip()
        user_id = request.args.get('user_id', type=int)
        book_id = request.args.get('book_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = BorrowRecord.query
        
        # Apply filters
        if status:
            query = query.filter_by(status=status)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if book_id:
            query = query.filter_by(book_id=book_id)
        
        # Paginate results
        pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Update overdue status
        for record in pagination.items:
            if record.status == 'borrowed' and record.is_overdue:
                record.status = 'overdue'
        
        db.session.commit()
        
        return jsonify({
            'borrow_records': [record.to_dict() for record in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/overdue', methods=['GET'])
@jwt_required()
def get_overdue_books():
    """Get all overdue borrow records (Admin only)."""
    # Check admin role
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get overdue records
        # Use naive datetime for SQLite compatibility
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        overdue_records = BorrowRecord.query.filter(
            BorrowRecord.status == 'borrowed',
            BorrowRecord.due_date < now_naive
        ).order_by(BorrowRecord.due_date).all()
        
        # Update status to overdue
        for record in overdue_records:
            record.status = 'overdue'
        
        db.session.commit()
        
        return jsonify({
            'overdue_records': [record.to_dict() for record in overdue_records],
            'total': len(overdue_records)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/<int:record_id>/approve', methods=['POST'])
@jwt_required()
def approve_borrow(record_id):
    """Approve a pending borrow request (Admin only)."""
    # Check admin role
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get borrow record
        borrow_record = BorrowRecord.query.get(record_id)
        
        if not borrow_record:
            return jsonify({'error': 'Borrow record not found'}), 404
        
        # Check if status is pending
        if borrow_record.status != 'pending':
            return jsonify({'error': 'Only pending borrow requests can be approved'}), 400
        
        # Get book
        book = borrow_record.book
        
        # Check if book is still available
        if book.available_copies <= 0:
            return jsonify({'error': 'Book is no longer available'}), 400
        
        # Approve the borrow request
        borrow_record.status = 'borrowed'
        borrow_record.borrow_date = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Update book available copies
        book.available_copies -= 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Borrow request approved successfully',
            'borrow_record': borrow_record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/<int:record_id>/reject', methods=['POST'])
@jwt_required()
def reject_borrow(record_id):
    """Reject a pending borrow request (Admin only)."""
    # Check admin role
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get borrow record
        borrow_record = BorrowRecord.query.get(record_id)
        
        if not borrow_record:
            return jsonify({'error': 'Borrow record not found'}), 404
        
        # Check if status is pending
        if borrow_record.status != 'pending':
            return jsonify({'error': 'Only pending borrow requests can be rejected'}), 400
        
        # Reject the borrow request
        borrow_record.status = 'rejected'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Borrow request rejected successfully',
            'borrow_record': borrow_record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/<int:record_id>/verify-return', methods=['POST'])
@jwt_required()
def verify_return(record_id):
    """Verify and approve a pending return (Admin only)."""
    # Check admin role
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get borrow record
        borrow_record = BorrowRecord.query.get(record_id)
        
        if not borrow_record:
            return jsonify({'error': 'Borrow record not found'}), 404
        
        # Check if status is pending_return
        if borrow_record.status != 'pending_return':
            return jsonify({'error': 'Only pending returns can be verified'}), 400
        
        # Verify the return
        borrow_record.status = 'returned'
        
        # Update book available copies
        book = borrow_record.book
        book.available_copies += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Return verified successfully',
            'borrow_record': borrow_record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """Get all pending borrow and return requests (Admin only)."""
    # Check admin role
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get pending borrow requests
        pending_borrows = BorrowRecord.query.filter_by(status='pending').order_by(BorrowRecord.created_at.desc()).all()
        
        # Get pending returns
        pending_returns = BorrowRecord.query.filter_by(status='pending_return').order_by(BorrowRecord.return_date.desc()).all()
        
        return jsonify({
            'pending_borrows': [record.to_dict() for record in pending_borrows],
            'pending_returns': [record.to_dict() for record in pending_returns],
            'total_pending': len(pending_borrows) + len(pending_returns)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
