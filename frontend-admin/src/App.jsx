import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PostsManager from './pages/PostsManager';
import PostForm from './pages/PostForm';
import EbooksManager from './pages/EbooksManager';
import EbookForm from './pages/EbookForm'; // 👈 ADD THIS IMPORT

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f1c] text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="bg-[#0f1422] border-b border-[#1e2a3a] px-6 py-3 flex justify-between items-center">
          <span className="text-xl font-bold text-white">
            Vexa<span className="text-[#00d4ff]">Trade</span> Ecosystem Admin
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              setIsAuthenticated(false);
            }}
            className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500/30"
          >
            Logout
          </button>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/posts" element={<PostsManager />} />
          <Route path="/posts/new" element={<PostForm />} />
          <Route path="/posts/edit/:id" element={<PostForm />} />
          <Route path="/ebooks" element={<EbooksManager />} />
          {/* 👇 ADD THESE TWO NEW ROUTES */}
          <Route path="/ebooks/new" element={<EbookForm />} />
          <Route path="/ebooks/edit/:id" element={<EbookForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;