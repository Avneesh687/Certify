import axios from 'axios';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    const rawUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
    return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
  }
  // Production fallback for Render live deployment
  if (import.meta.env.PROD) {
    return 'https://certify-eam5.onrender.com/api';
  }
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization JWT header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('certify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token if unauthenticated
      if (localStorage.getItem('certify_token')) {
        localStorage.removeItem('certify_token');
        localStorage.removeItem('certify_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
