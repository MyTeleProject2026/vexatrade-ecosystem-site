import { useState } from 'react';
import { userLogin } from '../api';

export default function LoginModal({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('📧 Login form submitted for:', email);
    
    try {
      await onLogin(email);
      console.log('✅ Login successful, modal should close');
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#131724] to-[#0f1422] rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-[90%] sm:max-w-md border border-[#00d4ff]/30 shadow-2xl transition-all duration-300 hover:shadow-[#00d4ff]/10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0033cc] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00d4ff]/20">
            <span className="text-2xl sm:text-3xl font-bold text-black">VT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to VexaEcosystem</h2>
          <p className="text-sm text-[#b0bedb]">Enter your email to access news, ebooks, and updates.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="relative">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f1422] border border-[#2a3440] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00d4ff] transition placeholder-[#6c86a3]"
              required
              disabled={loading}
            />
            {email && !loading && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">✓</span>
            )}
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00d4ff] text-black font-semibold py-3 rounded-xl hover:bg-[#00b8e6] disabled:opacity-50 transition text-base relative flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-[#6c86a3]">
            By continuing, you agree to our <span className="text-[#00d4ff] hover:underline cursor-pointer">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
}