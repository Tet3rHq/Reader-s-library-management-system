import apiClient from './client';
import type {
  User,
  LoginCredentials,
  RegisterData,
  ApiResponse,
} from '../types';

// Authentication API
export const authApi = {
  // Register a new user
  register: async (data: RegisterData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  // Check authentication status
  checkAuth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/check');
      return response.data.authenticated;
    } catch (error) {
      return false;
    }
  },
};
