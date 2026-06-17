import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ ADMIN AUTH ============
export const adminLogin = (email, password) => {
  return api.post('/admin/login', { email, password });
};

export const verifyAdmin = () => {
  return api.get('/admin/verify');
};

// ============ POSTS ============
export const getPosts = () => {
  return api.get('/posts');
};

export const getPost = (id) => {
  return api.get(`/posts/${id}`);
};

export const createPost = (formData) => {
  return api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updatePost = (id, formData) => {
  return api.put(`/posts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deletePost = (id) => {
  return api.delete(`/posts/${id}`);
};

// ============ EBOOKS ============
export const getEbooks = () => {
  return api.get('/ebooks');
};

export const getEbook = (id) => {
  return api.get(`/ebooks/${id}`);
};

export const createEbook = (formData) => {
  return api.post('/ebooks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateEbook = (id, formData) => {
  return api.put(`/ebooks/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteEbook = (id) => {
  return api.delete(`/ebooks/${id}`);
};

export default api;