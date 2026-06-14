import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminLogin = (email, password) => api.post('/admin/login', { email, password });
export const getPosts = () => api.get('/posts');
export const createPost = (formData) => api.post('/posts', formData);
export const updatePost = (id, formData) => api.put(`/posts/${id}`, formData);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const getEbooks = () => api.get('/ebooks');
export const createEbook = (formData) => api.post('/ebooks', formData);
export const deleteEbook = (id) => api.delete(`/ebooks/${id}`);

export default api;