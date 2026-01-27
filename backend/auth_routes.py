from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)
from extensions import db
from models import User
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"
    return True, ""


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        # Always create normal users through signup - admin is created during initialization
        role = 'user'
        
        # Validate input
        if not username or len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user (always with 'user' role)
        user = User(username=username, email=email, role=role)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and set JWT cookie."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ['username', 'password']):
            return jsonify({'error': 'Missing username or password'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Find user
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Create access token with user identity and role
        # Note: identity must be a string for JWT subject (sub) claim per JWT spec (RFC 7519)
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role}
        )
        
        # Create response
        response = jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        })
        
        # Set JWT cookie
        set_access_cookies(response, access_token)
        
        return response, 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and clear JWT cookie."""
    try:
        response = jsonify({'message': 'Logout successful'})
        unset_jwt_cookies(response)
        return response, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current logged-in user information."""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid authentication token format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/check', methods=['GET'])
@jwt_required()
def check_auth():
    """Check if user is authenticated."""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'authenticated': False}), 401
        
        return jsonify({
            'authenticated': True,
            'user': user.to_dict()
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid authentication token format'}), 400
    except Exception as e:
        return jsonify({'authenticated': False}), 401
