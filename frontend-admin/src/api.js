import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add debug logging for admin token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  
  console.log('🔑 Admin Token in localStorage:', token ? '✅ Present' : '❌ Missing');
  console.log('📡 Admin Request:', config.method.toUpperCase(), config.url);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Admin token added to request headers');
  } else {
    console.warn('⚠️ No admin token found for request:', config.url);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Admin Response success:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Admin API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.warn('⚠️ Admin unauthorized - clearing token');
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ ADMIN AUTH ============
export const adminLogin = (email, password) => {
  console.log('🔐 Admin login attempt for:', email);
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

// ✅ FIXED: View ebook with admin token
export const viewEbookAsAdmin = (id) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    alert('Please login as admin first');
    return;
  }
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
  window.open(`${apiUrl}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
};

export default api;