import { useState } from 'react';

export default function LoginModal({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#131724] rounded-2xl p-6 w-96 border border-[#00d4ff] shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Welcome to VexaTrade Ecosystem</h2>
        <p className="text-sm text-[#b0bedb] mb-6">Enter your email to access news, ebooks, and updates.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-[#00d4ff]"
            required
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00d4ff] text-black font-semibold py-2 rounded-lg hover:bg-[#00b8e6] disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}