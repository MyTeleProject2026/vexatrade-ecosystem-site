import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminLogin(email, password);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
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
          <button type="submit" className="w-full bg-[#00d4ff] text-black font-semibold py-2 rounded-lg hover:bg-[#00b8e6]">Login</button>
        </form>
      </div>
    </div>
  );
}