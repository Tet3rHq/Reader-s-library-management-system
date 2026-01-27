// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

// Book types
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  year: number;
  total_copies: number;
  available_copies: number;
  description?: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  year: number;
  total_copies: number;
  description?: string;
  cover_image?: File;
}

// Borrow Record types
export interface BorrowRecord {
  id: number;
  user_id: number;
  book_id: number;
  user?: User;
  book?: Book;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: 'pending' | 'borrowed' | 'pending_return' | 'returned' | 'overdue' | 'rejected';
  created_at: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items?: T[];
  books?: Book[];
  borrow_records?: BorrowRecord[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Report types
export interface SystemOverview {
  total_books: number;
  total_users: number;
  total_borrows: number;
  active_borrows: number;
  overdue_count: number;
  available_books: number;
  total_copies: number;
}

export interface BookWithCount extends Book {
  borrow_count: number;
}

export interface UserWithCount extends User {
  borrow_count: number;
}

export interface BorrowTrend {
  date: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  book_count: number;
  total_copies: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  message?: string;
  error?: string;
  user?: User;
  book?: Book;
  borrow_record?: BorrowRecord;
  authenticated?: boolean;
  data?: T;
}

export interface ApiError {
  error: string;
  status?: number;
}
