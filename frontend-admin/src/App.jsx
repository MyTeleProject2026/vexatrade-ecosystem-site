import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Simple Dashboard
function DashboardSimple() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      <p className="text-[#b0bedb] mt-4">If you see this, React is working.</p>
    </div>
  );
}

// Simple Login
function LoginSimple({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('https://vexatrade-ecosystem-api.onrender.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        onLogin();
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1c]">
      <div className="bg-[#131724] p-8 rounded-2xl border border-[#00d4ff] w-96">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white mb-4" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white mb-4" required />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-[#00d4ff] text-black font-semibold py-2 rounded-lg">Login</button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0b0f1c] text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginSimple onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="bg-[#0f1422] border-b border-[#1e2a3a] px-6 py-3 flex justify-between items-center">
          <span className="text-xl font-bold text-white">VexaTrade Ecosystem Admin</span>
          <button onClick={() => { localStorage.removeItem('adminToken'); setIsAuthenticated(false); }} className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded-full">Logout</button>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardSimple />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;