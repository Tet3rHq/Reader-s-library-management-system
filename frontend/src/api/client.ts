import axios, { type AxiosInstance, AxiosError } from 'axios';
import type { ApiError } from '../types';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://library-backend-latest.onrender.com/api',
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to read a cookie value by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

// Request interceptor: add CSRF header for mutating requests when using JWT cookies
apiClient.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method);
  if (needsCsrf) {
    const csrfToken = getCookie('csrf_access_token');
    if (csrfToken) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)['X-CSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - could redirect to login
      console.error('Unauthorized access');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
