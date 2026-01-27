import apiClient from './client';
import type {
  SystemOverview,
  BookWithCount,
  UserWithCount,
  BorrowTrend,
  CategoryDistribution,
  PaginatedResponse,
  BorrowRecord,
} from '../types';

// Reports API
export const reportsApi = {
  // Get system overview statistics
  getOverview: async (): Promise<SystemOverview> => {
    const response = await apiClient.get('/reports/overview');
    return response.data;
  },

  // Get most borrowed books
  getMostBorrowedBooks: async (limit?: number): Promise<{ most_borrowed_books: BookWithCount[] }> => {
    const response = await apiClient.get('/reports/most-borrowed', {
      params: { limit },
    });
    return response.data;
  },

  // Get borrowing history
  getBorrowingHistory: async (params?: {
    user_id?: number;
    book_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<BorrowRecord> & { history: BorrowRecord[] }> => {
    const response = await apiClient.get('/reports/borrowing-history', { params });
    return response.data;
  },

  // Get user activity
  getUserActivity: async (limit?: number): Promise<{ most_active_users: UserWithCount[] }> => {
    const response = await apiClient.get('/reports/user-activity', {
      params: { limit },
    });
    return response.data;
  },

  // Get borrowing trends
  getBorrowingTrends: async (days?: number): Promise<{ trends: BorrowTrend[]; days: number }> => {
    const response = await apiClient.get('/reports/trends', {
      params: { days },
    });
    return response.data;
  },

  // Get category distribution
  getCategoryDistribution: async (): Promise<{ distribution: CategoryDistribution[] }> => {
    const response = await apiClient.get('/reports/category-distribution');
    return response.data;
  },
};
