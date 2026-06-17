import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

// ✅ Add token to every request with debug logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    
    // Debug logging
    console.log('🔑 Token in localStorage:', token ? '✅ Present' : '❌ Missing');
    console.log('📡 Request URL:', config.method.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request headers');
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const userLogin = (email) => {
  console.log('📧 Calling userLogin API for:', email);
  return api.post('/user/login', { email });
};

export const getPosts = () => {
  console.log('📰 Fetching posts');
  return api.get('/posts');
};

export const getPost = (id) => {
  console.log('📰 Fetching post:', id);
  return api.get(`/posts/${id}`);
};

export const getEbooks = () => {
  console.log('📚 Fetching ebooks');
  return api.get('/ebooks');
};

export const getEbook = (id) => {
  console.log('📚 Fetching ebook:', id);
  return api.get(`/ebooks/${id}`);
};

export const downloadEbook = (id) => {
  console.log('📥 Downloading ebook:', id);
  window.open(`${API_BASE_URL}/api/ebooks/download/${id}`, '_blank');
};

export const viewEbook = async (id) => {
  const token = localStorage.getItem('userToken');
  console.log('📖 Viewing ebook:', id, 'Token present:', !!token);
  
  if (!token) {
    alert('Please login first');
    return;
  }
  window.open(`${API_BASE_URL}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
};

export default api;