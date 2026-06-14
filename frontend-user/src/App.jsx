import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userLogin } from './api';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import EbookDetail from './pages/EbookDetail';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setUser({ email });
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email) => {
    const res = await userLogin(email);
    localStorage.setItem('userToken', res.data.token);
    localStorage.setItem('userEmail', email);
    setUser({ email });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) return null;

  if (!user) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/ebook/:id" element={<EbookDetail />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;