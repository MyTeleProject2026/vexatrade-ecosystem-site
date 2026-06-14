import axios from 'axios';

// 🔁 Replace this with your actual backend URL
const API_BASE_URL = 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const userLogin = (email) => api.post('/user/login', { email });
export const getPosts = () => api.get('/posts');
export const getPost = (id) => api.get(`/posts/${id}`);
export const getEbooks = () => api.get('/ebooks');
export const getEbook = (id) => api.get(`/ebooks/${id}`);
export const downloadEbook = (id) => { window.open(`${API_BASE_URL}/api/ebooks/download/${id}`, '_blank'); };

export default api;