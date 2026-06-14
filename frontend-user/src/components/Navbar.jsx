import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

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

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/posts', label: 'News', icon: '📰' },
    { path: '/ebooks', label: 'Ebooks', icon: '📚' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-[#0f1422]/95 backdrop-blur-lg border-b border-[#00d4ff]/20' : 'bg-[#0f1422] border-b border-[#1e2a3a]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0033cc] flex items-center justify-center">
              <span className="text-black font-bold text-sm">VT</span>
            </div>
            <span className="text-lg sm:text-xl font-bold whitespace-nowrap">
              Vexa<span className="text-[#00d4ff]">Ecosystem</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === link.path
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'text-[#b0bedb] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center gap-4">
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
            <span className="text-white text-xl">{isMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#1e2a3a]">
            <div className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    location.pathname === link.path
                      ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                      : 'text-[#b0bedb] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
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