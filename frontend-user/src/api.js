import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const userLogin = (email) => api.post('/user/login', { email });
export const getPosts = () => api.get('/posts');
export const getPost = (id) => api.get(`/posts/${id}`);
export const getEbooks = () => api.get('/ebooks');
export const getEbook = (id) => api.get(`/ebooks/${id}`);
export const downloadEbook = (id) => {
  window.open(`${API_BASE_URL}/api/ebooks/download/${id}`, '_blank');
};

// ✅ FIXED: View ebook with authentication token
export const viewEbook = async (id) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    alert('Please login first');
    return;
  }
  // Open in new tab with token as query parameter
  window.open(`${API_BASE_URL}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
};

export default api;