import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import type { Book } from '../types';
import { booksApi } from '../api/books';
import { borrowApi } from '../api/borrow';
import { useAuth } from '../contexts/AuthContext';
import './Books.css';

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [search, category, page]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const response = await booksApi.getBooks({
        search,
        category,
        page,
        per_page: 12,
      });
      setBooks(response.books || []);
      setTotalPages(response.pages);
      setError('');
    } catch (err: any) {
      setError('Failed to load books');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await booksApi.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleBorrow = async (bookId: number) => {
    try {
      await borrowApi.borrowBook(bookId);
      alert('Book borrowed successfully!');
      fetchBooks(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to borrow book');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  return (
    <Layout>
      <div className="books-page">
        <div className="page-header">
          <h1>Browse Books</h1>
          <p>Discover and borrow from our collection</p>
        </div>

        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>

          <div className="category-filter">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="category-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div className="loading">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="no-results">
            <p>No books found</p>
          </div>
        ) : (
          <>
            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onBorrow={handleBorrow}
                  isAdmin={isAdmin}
                  showActions={!isAdmin}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Books;
