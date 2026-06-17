import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react'; // ⬅️ install lucide-react if not already

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    onLogout();
    navigate('/');
    setIsMenuOpen(false);
  };
  
  // Determine if we're on a detail page (post or ebook)
  const isDetailPage = location.pathname.startsWith('/post/') || location.pathname.startsWith('/ebook/');
  const isEbooksPage = location.pathname === '/ebooks';
  const isPostsPage = location.pathname === '/posts';
  const showBackButton = isDetailPage || isEbooksPage || isPostsPage;
  
  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-[#0f1422]/95 backdrop-blur-lg border-b border-[#00d4ff]/20' : 'bg-[#0f1422] border-b border-[#1e2a3a]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Logo + Back button */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0033cc] flex items-center justify-center">
                <span className="text-black font-bold text-sm">VT</span>
              </div>
              <span className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Vexa<span className="text-[#00d4ff]">Ecosystem</span>
              </span>
            </Link>

            {/* ✅ Dynamic Back Button (always visible when on detail/posts/ebooks pages) */}
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="ml-2 flex items-center gap-1 text-sm text-[#b0bedb] hover:text-[#00d4ff] transition bg-[#1a2332] px-3 py-1 rounded-full border border-[#2a3440] hover:border-[#00d4ff]"
                aria-label="Go back"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>

          {/* Desktop Navigation (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* You can add other nav links here if needed, but we already have them in mobile menu */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-[#b0bedb]">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full hover:bg-red-500/30 transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#1e2a3a]">
            <div className="flex flex-col gap-2">
              {/* Mobile back button (if needed) - already in the top bar, but also can add here */}
              {showBackButton && (
                <button
                  onClick={() => { navigate(-1); setIsMenuOpen(false); }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#b0bedb] hover:text-white hover:bg-white/5 transition text-left flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#b0bedb] hover:text-white hover:bg-white/5 transition"
              >
                🏠 Home
              </Link>
              <Link
                to="/posts"
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/posts'
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'text-[#b0bedb] hover:text-white hover:bg-white/5'
                }`}
              >
                📰 News
              </Link>
              <Link
                to="/ebooks"
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/ebooks'
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'text-[#b0bedb] hover:text-white hover:bg-white/5'
                }`}
              >
                📚 Ebooks
              </Link>
              <div className="h-px bg-[#2a3440] my-2"></div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 mx-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-sm text-[#b0bedb] truncate">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="mx-3 text-sm bg-red-500/20 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/30 transition text-left"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}