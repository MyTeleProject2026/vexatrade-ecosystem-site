import axios from 'axios';

// Use environment variable if set, otherwise fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Admin auth
export const adminLogin = (email, password) => api.post('/admin/login', { email, password });

// Posts
export const getPosts = () => api.get('/posts');
export const getPost = (id) => api.get(`/posts/${id}`);
export const createPost = (formData) => api.post('/posts', formData);
export const updatePost = (id, formData) => api.put(`/posts/${id}`, formData);
export const deletePost = (id) => api.delete(`/posts/${id}`);

// Ebooks
export const getEbooks = () => api.get('/ebooks');
export const getEbook = (id) => api.get(`/ebooks/${id}`);
export const createEbook = (formData) => api.post('/ebooks', formData);
export const deleteEbook = (id) => api.delete(`/ebooks/${id}`);

export default api;