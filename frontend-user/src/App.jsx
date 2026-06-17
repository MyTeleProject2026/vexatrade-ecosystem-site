import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userLogin } from './api';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import Home from './pages/Home';
import PostsPage from './pages/PostsPage';
import PostDetail from './pages/PostDetail';
import EbooksPage from './pages/EbooksPage';
import EbookDetail from './pages/EbookDetail';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setUser({ email });
      console.log('✅ User restored from localStorage:', email);
    }
    setLoading(false);
  }, []);
  
  const handleLogin = async (email) => {
    try {
      console.log('📧 Attempting login for:', email);
      const res = await userLogin(email);
      
      // ✅ Check response and store token
      if (res.data.success && res.data.token) {
        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('userEmail', email);
        setUser({ email });
        console.log('✅ Login successful, token stored');
        return res;
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      console.error('❌ Login failed:', err);
      throw err;
    }
  };
  
  if (loading) return null;
  if (!user) return <LoginModal onLogin={handleLogin} />;
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0f1c]">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="pt-4 pb-20 md:pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/ebooks" element={<EbooksPage />} />
            <Route path="/ebook/:id" element={<EbookDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;