import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import config
from extensions import db, migrate, jwt
from models import User, Book, BorrowRecord
from auth_routes import auth_bp
from book_routes import books_bp
from borrow_routes import borrow_bp
from report_routes import reports_bp


def create_app(config_name=None):
    """Application factory for creating Flask app instance."""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS'],
         allow_headers=['Content-Type', 'X-CSRF-TOKEN'],
         expose_headers=['Set-Cookie'])
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(borrow_bp)
    app.register_blueprint(reports_bp)
    
    # Serve uploaded book cover images
    @app.route('/api/uploads/covers/<filename>', methods=['GET'])
    def serve_cover_image(filename):
        """Serve book cover images."""
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'covers')
        return send_from_directory(uploads_dir, filename)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({'error': 'Invalid token', 'message': reason}), 401
    
    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return jsonify({'error': 'Missing authorization token', 'message': reason}), 401
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Library Management System API is running'
        }), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Welcome to Library Management System API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'books': '/api/books',
                'borrow': '/api/borrow',
                'reports': '/api/reports'
            }
        }), 200
    
    return app


if __name__ == '__main__':
    app = create_app()
    # Only run with debug=True in development
    # In production, use a proper WSGI server like Gunicorn
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
