import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
