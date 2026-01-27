import apiClient from './client';
import type {
  Book,
  BookFormData,
  PaginatedResponse,
  ApiResponse,
} from '../types';

// Books API
export const booksApi = {
  // Get all books with optional search and filtering
  getBooks: async (params?: {
    search?: string;
    category?: string;
    author?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Book>> => {
    const response = await apiClient.get('/books', { params });
    return response.data;
  },

  // Get a specific book
  getBook: async (id: number): Promise<Book> => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data.book;
  },

  // Create a new book (Admin only)
  createBook: async (data: BookFormData): Promise<ApiResponse> => {
    // Check if there's a cover image to upload
    if (data.cover_image) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('author', data.author);
      formData.append('isbn', data.isbn);
      formData.append('category', data.category);
      formData.append('year', data.year.toString());
      formData.append('total_copies', data.total_copies.toString());
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('cover_image', data.cover_image);
      
      const response = await apiClient.post('/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await apiClient.post('/books', data);
      return response.data;
    }
  },

  // Update a book (Admin only)
  updateBook: async (id: number, data: Partial<BookFormData>): Promise<ApiResponse> => {
    // Check if there's a cover image to upload
    if (data.cover_image) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.author) formData.append('author', data.author);
      if (data.isbn) formData.append('isbn', data.isbn);
      if (data.category) formData.append('category', data.category);
      if (data.year) formData.append('year', data.year.toString());
      if (data.total_copies) formData.append('total_copies', data.total_copies.toString());
      if (data.description) formData.append('description', data.description);
      formData.append('cover_image', data.cover_image);
      
      const response = await apiClient.put(`/books/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await apiClient.put(`/books/${id}`, data);
      return response.data;
    }
  },

  // Delete a book (Admin only)
  deleteBook: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/books/${id}`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/books/categories');
    return response.data.categories;
  },

  // Get book cover image URL
  getCoverImageUrl: (filename?: string): string => {
    if (!filename) return '';
    return `${apiClient.defaults.baseURL}/uploads/covers/${filename}`;
  },
};
