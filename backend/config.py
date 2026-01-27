import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration class with common settings."""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database Configuration
    # Use PostgreSQL in production, SQLite for development/testing
    database_url = os.getenv('DATABASE_URL', '')
    if not database_url or database_url == '':
        # Default to SQLite for easier development
        SQLALCHEMY_DATABASE_URI = 'sqlite:///library.db'
    else:
        SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_TOKEN_LOCATION = ['cookies']
    JWT_COOKIE_SECURE = os.getenv('JWT_COOKIE_SECURE', 'False') == 'True'
    JWT_COOKIE_CSRF_PROTECT = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'True') == 'True'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '1')))
    JWT_COOKIE_SAMESITE = 'Lax'
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    CORS_SUPPORTS_CREDENTIALS = True


class DevelopmentConfig(Config):
    """Development-specific configuration."""
    DEBUG = True
    JWT_COOKIE_SECURE = False


class ProductionConfig(Config):
    """Production-specific configuration."""
    DEBUG = False
    JWT_COOKIE_SECURE = True


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
