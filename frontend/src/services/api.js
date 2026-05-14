import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 60000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  googleLoginCode: (data) => API.post('/auth/google/callback', data),
  sendOTP: (data) => API.post('/auth/send-otp', data),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  resendOTP: (data) => API.post('/auth/resend-otp', data),
  me: () => API.get('/auth/me'),
};

export const scoreAPI = {
  score: (data) => API.post('/score', data),
  ats: (data) => API.post('/score/ats', data),
};

export const rewriteAPI = {
  rewrite: (data) => API.post('/rewrite', data),
};

export const coverLetterAPI = {
  generate: (data) => API.post('/cover-letter', data),
};

export const historyAPI = {
  list: (page = 1) => API.get(`/history?page=${page}`),
  get: (id) => API.get(`/history/${id}`),
  delete: (id) => API.delete(`/history/${id}`),
  stats: () => API.get('/history/me/stats'),
};

export const compareAPI = {
  compare: (data) => API.post('/compare', data),
};

export default API;