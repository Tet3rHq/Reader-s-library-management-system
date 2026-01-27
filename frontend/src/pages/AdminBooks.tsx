import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import type { Book, BookFormData } from '../types';
import { booksApi } from '../api/books';
import './AdminBooks.css';

interface BookModalProps {
  book?: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BookFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

const BookModal: React.FC<BookModalProps> = ({ book, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    year: new Date().getFullYear(),
    total_copies: 1,
    description: '',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (book && mode === 'edit') {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        year: book.year,
        total_copies: book.total_copies,
        description: book.description || '',
      });
      // Set preview for existing cover image
      if (book.cover_image) {
        setCoverImagePreview(booksApi.getCoverImageUrl(book.cover_image));
      } else {
        setCoverImagePreview('');
      }
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: '',
        year: new Date().getFullYear(),
        total_copies: 1,
        description: '',
      });
      setCoverImagePreview('');
    }
    setCoverImage(null);
    setError('');
  }, [book, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'total_copies' ? parseInt(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PNG, JPG, GIF, or WEBP image.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large. Maximum size is 5MB.');
        return;
      }

      setCoverImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim() || !formData.category.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.year < 1000 || formData.year > 9999) {
      setError('Please enter a valid year');
      return;
    }

    if (formData.total_copies < 1) {
      setError('Total copies must be at least 1');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        cover_image: coverImage || undefined,
      };
      await onSave(dataToSubmit);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save book');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Add New Book' : 'Edit Book'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="book-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="isbn">ISBN *</label>
              <input
                type="text"
                id="isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1000"
                max="9999"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Fiction, Science, Technology"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="total_copies">Total Copies *</label>
              <input
                type="number"
                id="total_copies"
                name="total_copies"
                value={formData.total_copies}
                onChange={handleChange}
                min="1"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cover_image">Book Cover Image</label>
            <input
              type="file"
              id="cover_image"
              name="cover_image"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            {coverImagePreview && (
              <div className="cover-image-preview">
                <img src={coverImagePreview} alt="Cover preview" style={{ maxWidth: '200px', maxHeight: '300px', marginTop: '10px' }} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Book' : 'Update Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
        per_page: 20,
      });
      setBooks(response.books || []);
      setTotalPages(response.pages);
      setTotal(response.total);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleCreateBook = () => {
    setSelectedBook(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (book: Book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    try {
      await booksApi.deleteBook(book.id);
      alert('Book deleted successfully!');
      fetchBooks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete book');
    }
  };

  const handleSaveBook = async (data: BookFormData) => {
    if (modalMode === 'create') {
      await booksApi.createBook(data);
      alert('Book created successfully!');
    } else if (selectedBook) {
      await booksApi.updateBook(selectedBook.id, data);
      alert('Book updated successfully!');
    }
    fetchBooks();
  };

  return (
    <Layout>
      <div className="admin-books-page">
        <div className="page-header">
          <div>
            <h1>Books Management</h1>
            <p>Manage your library's book collection</p>
          </div>
          <button className="btn-primary" onClick={handleCreateBook}>
            + Add New Book
          </button>
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

        <div className="stats-bar">
          <span>Total Books: {total}</span>
          <span>Showing: {books.length} on page {page}</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div className="loading">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="no-results">
            <p>No books found</p>
            <button className="btn-primary" onClick={handleCreateBook}>
              Add Your First Book
            </button>
          </div>
        ) : (
          <>
            <div className="books-table-container">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th>Copies</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td>{book.id}</td>
                      <td className="book-title">{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.isbn}</td>
                      <td>
                        <span className="category-badge">{book.category}</span>
                      </td>
                      <td>{book.year}</td>
                      <td>{book.total_copies}</td>
                      <td>
                        <span className={`availability ${book.available_copies > 0 ? 'available' : 'unavailable'}`}>
                          {book.available_copies}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditBook(book)}
                            title="Edit book"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteBook(book)}
                            title="Delete book"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        <BookModal
          book={selectedBook}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBook}
          mode={modalMode}
        />
      </div>
    </Layout>
  );
};

export default AdminBooks;
