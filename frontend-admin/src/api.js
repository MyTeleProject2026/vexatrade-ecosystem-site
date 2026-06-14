import axios from 'axios';

// 🔁 Replace this with your actual backend URL
const API_BASE_URL = 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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