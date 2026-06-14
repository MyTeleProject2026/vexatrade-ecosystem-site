import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Attach token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userLogin = (email) => api.post('/user/login', { email });
export const getPosts = () => api.get('/posts');
export const getPost = (id) => api.get(`/posts/${id}`);
export const getEbooks = () => api.get('/ebooks');
export const getEbook = (id) => api.get(`/ebooks/${id}`);
export const downloadEbook = (id) => {
  window.open(`/api/ebooks/download/${id}`, '_blank');
};

export default api;