import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import { AuthState, User } from '../features/auth/types/auth.types';

interface AuthActions {
  login: (credentials: Record<string, string>) => Promise<void>;
  register: (userData: Record<string, string>) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // Initial State
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // POST /api/auth/register
      await axiosInstance.post('/auth/register', userData);
      set({ isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Registration failed',
      });
      throw err;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      // POST /api/auth/login
      const response = await axiosInstance.post('/auth/login', credentials);

      // Adjusting the structure: response.data -> { status, message, data: { token, user } }
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Backup user data for refresh persistence

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Login failed',
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Synchronize login status when browser is refreshed
  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      set({
        token,
        user: JSON.parse(savedUser) as User,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Just in case JSON parse error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
    }
  },
}));
