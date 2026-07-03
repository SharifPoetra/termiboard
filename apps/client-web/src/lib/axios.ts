import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseEnvUrl = import.meta.env.VITE_API_URL;
const API_URL = baseEnvUrl ? `${baseEnvUrl}/api` : 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically insert JWT Token in every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor to automatically handle global unauthorized states (401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns a 401 Unauthorized, token has expired or is invalid
    if (error.response && error.response.status === 401) {
      console.warn('[AXIOS_GATE] 401 Unauthorized intercepted. Evacuating stale auth session...');

      // Access store state directly out of React lifecycle to trigger an immediate purge
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
