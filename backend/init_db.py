"""
Database initialization and seeding script.

This script:
1. Creates all database tables
2. Seeds the database with initial data (admin user, sample books)
"""

import os
from app import create_app
from extensions import db
from models import User, Book, BorrowRecord
from datetime import datetime


def init_database():
    """Initialize database and create all tables."""
    app = create_app()
    
    with app.app_context():
        # Drop all tables (use with caution!)
        # db.drop_all()
        
        # Create all tables
        db.create_all()
        
        print("✓ Database tables created successfully")


def seed_database():
    """Seed database with initial data."""
    app = create_app()
    
    with app.app_context():
        # Check if admin user already exists
        admin = User.query.filter_by(username='kca-library').first()
        
        if not admin:
            # Create admin user with specified credentials
            # Get admin password from environment variable or use default (for initial setup)
            admin_password = os.getenv('ADMIN_PASSWORD', 'KcaLibrary@2024')
            
            admin = User(
                username='kca-library',
                email='library@kcau.ac.ke',
                role='admin'
            )
            admin.set_password(admin_password)
            db.session.add(admin)
            print("✓ Admin user created (username: kca-library, email: library@kcau.ac.ke)")
        else:
            print("✓ Admin user already exists")
        
        # Sample books data
        sample_books = [
            {
                'title': 'To Kill a Mockingbird',
                'author': 'Harper Lee',
                'isbn': '978-0-06-112008-4',
                'category': 'Fiction',
                'year': 1960,
                'total_copies': 5,
                'description': 'A classic novel about racial injustice in the American South.',
                'cover_image': 'To Kill a Mockingbird.jpg'
            },
            {
                'title': '1984',
                'author': 'George Orwell',
                'isbn': '978-0-452-28423-4',
                'category': 'Science Fiction',
                'year': 1949,
                'total_copies': 4,
                'description': 'A dystopian novel about totalitarianism and surveillance.',
                'cover_image': '1984.webp'
            },
            {
                'title': 'The Great Gatsby',
                'author': 'F. Scott Fitzgerald',
                'isbn': '978-0-7432-7356-5',
                'category': 'Fiction',
                'year': 1925,
                'total_copies': 3,
                'description': 'A story of wealth, love, and the American Dream in the 1920s.',
                'cover_image': 'The Great Gatsby.jpg'
            },
            {
                'title': 'Pride and Prejudice',
                'author': 'Jane Austen',
                'isbn': '978-0-14-143951-8',
                'category': 'Romance',
                'year': 1813,
                'total_copies': 4,
                'description': 'A romantic novel about manners and marriage in Georgian England.',
                'cover_image': 'Pride and Prejudice.jpg'
            },
            {
                'title': 'The Catcher in the Rye',
                'author': 'J.D. Salinger',
                'isbn': '978-0-316-76948-0',
                'category': 'Fiction',
                'year': 1951,
                'total_copies': 3,
                'description': 'A story about teenage rebellion and alienation.',
                'cover_image': 'The Catcher in the Rye.jpg'
            },
            {
                'title': 'Clean Code',
                'author': 'Robert C. Martin',
                'isbn': '978-0-13-235088-4',
                'category': 'Technology',
                'year': 2008,
                'total_copies': 5,
                'description': 'A handbook of agile software craftsmanship.',
                'cover_image': 'Clean-Code.webp'
            },
            {
                'title': 'Introduction to Algorithms',
                'author': 'Thomas H. Cormen',
                'isbn': '978-0-262-03384-8',
                'category': 'Technology',
                'year': 2009,
                'total_copies': 4,
                'description': 'A comprehensive textbook on computer algorithms.',
                'cover_image': 'Introduction to Algorithms.webp'
            },
            {
                'title': 'The Hobbit',
                'author': 'J.R.R. Tolkien',
                'isbn': '978-0-345-33968-3',
                'category': 'Fantasy',
                'year': 1937,
                'total_copies': 5,
                'description': 'A fantasy adventure about a hobbit\'s quest.',
                'cover_image': 'The Hobbit.webp'
            },
            {
                'title': 'Harry Potter and the Sorcerer\'s Stone',
                'author': 'J.K. Rowling',
                'isbn': '978-0-439-70818-8',
                'category': 'Fantasy',
                'year': 1997,
                'total_copies': 6,
                'description': 'The first book in the Harry Potter series.',
                'cover_image': 'Harry Potter and the Sorcerer\'s Stone.webp' 
            },
            {
                'title': 'The Design of Everyday Things',
                'author': 'Don Norman',
                'isbn': '978-0-465-05065-9',
                'category': 'Design',
                'year': 2013,
                'total_copies': 3,
                'description': 'A book about user-centered design principles.',
                'cover_image': 'The Design of Everyday Things.webp'
            }
        ]
        
        # Add sample books
        books_added = 0
        for book_data in sample_books:
            existing_book = Book.query.filter_by(isbn=book_data['isbn']).first()
            if not existing_book:
                book = Book(
                    title=book_data['title'],
                    author=book_data['author'],
                    isbn=book_data['isbn'],
                    category=book_data['category'],
                    year=book_data['year'],
                    total_copies=book_data['total_copies'],
                    available_copies=book_data['total_copies'],
                    description=book_data['description'],
                    cover_image=book_data['cover_image']
                )
                db.session.add(book)
                books_added += 1
        
        if books_added > 0:
            print(f"✓ Added {books_added} sample books")
        else:
            print("✓ Sample books already exist")
        
        # Commit all changes
        db.session.commit()
        print("\n✓ Database seeding completed successfully!")
        print("\nAdmin Account Created:")
        print("  Username: kca-library")
        print("  Email: library@kcau.ac.ke")
        print("  (Password set from ADMIN_PASSWORD environment variable or default)")


if __name__ == '__main__':
    print("Initializing database...")
    init_database()
    print("\nSeeding database...")
    seed_database()
