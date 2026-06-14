import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    onLogout();
    navigate('/');
  };
  return (
    <nav className="bg-[#0f1422] border-b border-[#1e2a3a] px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold">
        Vexa<span className="text-[#00d4ff]">Ecosystem</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#b0bedb]">{user?.email}</span>
        <button onClick={handleLogout} className="text-sm bg-[#00d4ff] text-black px-3 py-1 rounded-full hover:bg-[#00b8e6]">Logout</button>
      </div>
    </nav>
  );
}