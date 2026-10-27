import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'https://project-apaar-bc.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trustseat_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    // If the server returned an HTML document (e.g. from Vercel SPA rewrite fallback), reject it as an API error
    if (typeof response.data === 'string' && (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html'))) {
      return Promise.reject(new Error('Backend API unreachable or returned HTML instead of JSON.'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/confirm-admission')) {
      localStorage.removeItem('trustseat_token');
      localStorage.removeItem('trustseat_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
