import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PostsManager from './pages/PostsManager';
import PostForm from './pages/PostForm';
import EbooksManager from './pages/EbooksManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminToken')) setIsAuthenticated(true);
  }, []);

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="bg-[#0f1422] border-b border-[#1e2a3a] px-6 py-3 flex justify-between">
          <span className="text-xl font-bold">VexaTrade Ecosystem Admin</span>
          <button onClick={() => { localStorage.removeItem('adminToken'); window.location.reload(); }} className="text-sm text-red-400">Logout</button>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/posts" element={<PostsManager />} />
          <Route path="/posts/new" element={<PostForm />} />
          <Route path="/posts/edit/:id" element={<PostForm />} />
          <Route path="/ebooks" element={<EbooksManager />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;