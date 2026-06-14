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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#131724] to-[#0f1422] rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-[90%] sm:max-w-md border border-[#00d4ff]/30 shadow-2xl animate-fadeIn">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0033cc] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-black">VT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to VexaEcosystem</h2>
          <p className="text-sm text-[#b0bedb]">Enter your email to access news, ebooks, and updates.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0f1422] border border-[#2a3440] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00d4ff] transition"
            required
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00d4ff] text-black font-semibold py-3 rounded-xl hover:bg-[#00b8e6] disabled:opacity-50 transition text-base"
          >
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
        
        <p className="text-xs text-center text-[#6c86a3] mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}