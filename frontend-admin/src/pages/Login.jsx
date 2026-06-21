import { useState } from 'react';
import { adminLogin } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await adminLogin(email, password);
      if (res.data.success && res.data.token) {
        localStorage.setItem('adminToken', res.data.token);
        onLogin();
      } else {
        setError('Login failed: No token received');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1c] flex items-center justify-center p-4">
      <div className="bg-[#0f1422] p-8 rounded-2xl border border-[#2a3440] max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Admin Login</h1>
        <p className="text-[#b0bedb] text-sm text-center mb-6">Enter your credentials to access the control panel</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff]"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00d4ff] text-black font-semibold py-3 rounded-full hover:bg-[#00b8e6] disabled:opacity-50 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
