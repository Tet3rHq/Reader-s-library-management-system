import apiClient from './client';
import type {
  BorrowRecord,
  PaginatedResponse,
  ApiResponse,
} from '../types';

// Borrow API
export const borrowApi = {
  // Borrow a book (creates pending request)
  borrowBook: async (bookId: number): Promise<ApiResponse> => {
    const response = await apiClient.post('/borrow', { book_id: bookId });
    return response.data;
  },

  // Return a book (creates pending return)
  returnBook: async (recordId: number): Promise<ApiResponse> => {
    const response = await apiClient.post(`/borrow/${recordId}/return`);
    return response.data;
  },

  // Get current user's borrow records
  getMyBorrows: async (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<BorrowRecord>> => {
    const response = await apiClient.get('/borrow/my-borrows', { params });
    return response.data;
  },

  // Get all borrow records (Admin only)
  getAllBorrows: async (params?: {
    status?: string;
    user_id?: number;
    book_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<BorrowRecord>> => {
    const response = await apiClient.get('/borrow/all', { params });
    return response.data;
  },

  // Get overdue records (Admin only)
  getOverdueRecords: async (): Promise<{ overdue_records: BorrowRecord[]; total: number }> => {
    const response = await apiClient.get('/borrow/overdue');
    return response.data;
  },

  // Get pending requests (Admin only)
  getPendingRequests: async (): Promise<{
    pending_borrows: BorrowRecord[];
    pending_returns: BorrowRecord[];
    total_pending: number;
  }> => {
    const response = await apiClient.get('/borrow/pending');
    return response.data;
  },

  // Approve a borrow request (Admin only)
  approveBorrow: async (recordId: number): Promise<ApiResponse> => {
    const response = await apiClient.post(`/borrow/${recordId}/approve`);
    return response.data;
  },

  // Reject a borrow request (Admin only)
  rejectBorrow: async (recordId: number): Promise<ApiResponse> => {
    const response = await apiClient.post(`/borrow/${recordId}/reject`);
    return response.data;
  },

  // Verify a return (Admin only)
  verifyReturn: async (recordId: number): Promise<ApiResponse> => {
    const response = await apiClient.post(`/borrow/${recordId}/verify-return`);
    return response.data;
  },
};
