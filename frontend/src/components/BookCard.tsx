import React from 'react';
import type { Book } from '../types';
import { booksApi } from '../api/books';
import './BookCard.css';

interface BookCardProps {
  book: Book;
  onBorrow?: (bookId: number) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: number) => void;
  isAdmin?: boolean;
  showActions?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  onBorrow,
  onEdit,
  onDelete,
  isAdmin = false,
  showActions = true,
}) => {
  const isAvailable = book.available_copies > 0;
  const coverImageUrl = book.cover_image ? booksApi.getCoverImageUrl(book.cover_image) : null;

  return (
    <div className="book-card">
      {coverImageUrl && (
        <div className="book-cover">
          <img src={coverImageUrl} alt={`${book.title} cover`} />
        </div>
      )}
      
      <div className="book-header">
        <h3 className="book-title">{book.title}</h3>
        <span className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="book-details">
        <p className="book-author">
          <strong>Author:</strong> {book.author}
        </p>
        <p className="book-info">
          <strong>ISBN:</strong> {book.isbn}
        </p>
        <p className="book-info">
          <strong>Category:</strong> {book.category}
        </p>
        <p className="book-info">
          <strong>Year:</strong> {book.year}
        </p>
        <p className="book-info">
          <strong>Copies:</strong> {book.available_copies} / {book.total_copies}
        </p>
        {book.description && (
          <p className="book-description">{book.description}</p>
        )}
      </div>

      {showActions && (
        <div className="book-actions">
          {isAdmin ? (
            <>
              <button
                onClick={() => onEdit?.(book)}
                className="btn btn-edit"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete?.(book.id)}
                className="btn btn-delete"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={() => onBorrow?.(book.id)}
              className="btn btn-borrow"
              disabled={!isAvailable}
            >
              {isAvailable ? 'Borrow' : 'Not Available'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookCard;
