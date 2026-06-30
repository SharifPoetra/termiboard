import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import { AuthState } from '../features/auth/types/auth.types';
import { UserResponseData } from '@termiboard/core';

interface AuthActions {
  login: (credentials: Record<string, string>) => Promise<void>;
  register: (userData: Record<string, string>) => Promise<string>;
  logout: () => void;
  initializeAuth: () => void;
  clearError: () => void;
  updateProfile: (profileData: { username?: string; email?: string; password?: string }) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
}

// Helper function to non-destructively decode JWT expiration time
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const { exp } = JSON.parse(jsonPayload);
    // Convert 'exp' seconds timestamp into milliseconds and compare with current time
    return Date.now() >= exp * 1000;
  } catch {
    return true; // Assume expired if token structure is corrupted
  }
};

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
      const response = await axiosInstance.post('/auth/register', userData);
      set({ isLoading: false });
      return response.data.data.email;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Registration failed',
      });
      throw err;
    }
  },

  verifyOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      // POST /api/auth/verify-otp
      const response = await axiosInstance.post('/auth/verify-otp', { email, otp });
      const { token, user } = response.data.data;

      // If the OTP is valid, the backend returns a token. Save it to storage.
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Verification rejected',
      });
      throw err;
    }
  },

  resendOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      // POST /api/auth/resend-otp
      await axiosInstance.post('/auth/resend-otp', { email });
      set({ isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Resend signal blocked',
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

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      // Filter out empty password strings so we don't accidentally override with blank data
      const payload = { ...profileData };
      if (payload.password === '') delete payload.password;

      // PATCH /api/auth/profile
      const response = await axiosInstance.patch('/auth/profile', payload);
      const { user } = response.data.data;

      // Re-save updated user credentials back to client storage layer
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to reconfigure profile parameters',
      });
      throw err;
    }
  },

  // Synchronize and validate login status when browser triggers an initial boot or refresh
  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser || isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      set({
        token,
        user: JSON.parse(savedUser) as UserResponseData,
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
