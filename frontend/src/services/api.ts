import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('ipmprs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config.url && error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('ipmprs_token');
        localStorage.removeItem('ipmprs_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
