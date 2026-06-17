import { useEffect, useState } from 'react';
import { getEbooks, deleteEbook } from '../api';
import { Link } from 'react-router-dom';

export default function EbooksManager() {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEbooks = async () => {
    try {
      const res = await getEbooks();
      setEbooks(res.data.data || []);
    } catch (err) {
      setError('Failed to load ebooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEbooks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ebook permanently?')) return;
    try {
      await deleteEbook(id);
      loadEbooks();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // ✅ Fixed: View ebook with admin token
  const handleViewEbook = (ebook) => {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      alert('Please login as admin first');
      return;
    }

    if (ebook.file_type === 'html' || ebook.file_url?.endsWith('.html')) {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
      window.open(`${apiUrl}/api/ebooks/view/${ebook.id}?token=${encodeURIComponent(token)}`, '_blank');
    } else {
      if (ebook.file_url) {
        window.open(ebook.file_url, '_blank');
      } else {
        alert('No file URL available');
      }
    }
  };

  // ✅ Helper: Check if image is SVG
  const isSvgImage = (url) => {
    if (!url) return false;
    return url.startsWith('data:image/svg+xml') || url.endsWith('.svg');
  };

  // ✅ Helper: Extract SVG code from data URL
  const getSvgCode = (url) => {
    if (!url || !url.startsWith('data:image/svg+xml')) return '';
    try {
      const svgContent = decodeURIComponent(url.split(',')[1] || '');
      return svgContent;
    } catch (e) {
      return '';
    }
  };

  // ✅ Helper: Render image (SVG or regular)
  const renderImage = (url, title, className = "w-12 h-12 rounded object-cover") => {
    if (!url) {
      return <span className="text-2xl">📘</span>;
    }
    
    if (isSvgImage(url)) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: getSvgCode(url) }}
          className={`${className} flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]`}
          style={{ minWidth: '48px', minHeight: '48px' }}
        />
      );
    }
    
    return (
      <img 
        src={url} 
        alt={title} 
        className={className}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<span class="text-2xl">📘</span>';
        }}
      />
    );
  };

  const getFileIcon = (ebook) => {
    if (ebook.file_type === 'html') return '📘';
    if (ebook.file_type === 'pdf') return '📕';
    return '📄';
  };

  if (loading) return <div className="p-6 text-white">Loading ebooks...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Ebooks & Guides</h1>
        <Link to="/ebooks/new" className="bg-[#00d4ff] text-black px-4 py-2 rounded-full hover:bg-[#00b8e6]">
          + New Ebook
        </Link>
      </div>

      {ebooks.length === 0 ? (
        <p className="text-[#b0bedb]">No ebooks yet. Create your first ebook.</p>
      ) : (
        <div className="space-y-4">
          {ebooks.map((ebook) => (
            <div key={ebook.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* ✅ Fixed: SVG image rendering */}
                {ebook.cover_image_url ? (
                  <div className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex-shrink-0">
                    {isSvgImage(ebook.cover_image_url) ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: getSvgCode(ebook.cover_image_url) }}
                        className="w-full h-full flex items-center justify-center"
                      />
                    ) : (
                      <img 
                        src={ebook.cover_image_url} 
                        alt={ebook.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="text-2xl flex items-center justify-center w-full h-full">📘</span>';
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-2xl w-12 h-12 flex items-center justify-center">{getFileIcon(ebook)}</span>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{ebook.title}</h3>
                  <p className="text-sm text-[#b0bedb]">{ebook.description?.slice(0, 100)}</p>
                  <p className="text-xs text-[#6c86a3] mt-1">
                    {ebook.file_type === 'html' ? '📘 HTML Ebook' : ebook.file_type === 'pdf' ? '📕 PDF Document' : '📄 Document'}
                    {ebook.is_html_mode && ' • HTML Mode'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link 
                  to={`/ebooks/edit/${ebook.id}`} 
                  className="text-[#00d4ff] hover:underline text-sm"
                >
                  Edit
                </Link>
                <button 
                  onClick={() => handleViewEbook(ebook)} 
                  className="text-[#00d4ff] hover:underline text-sm"
                >
                  View
                </button>
                <a
                  href={ebook.file_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00d4ff] hover:underline text-sm"
                >
                  Download
                </a>
                <button 
                  onClick={() => handleDelete(ebook.id)} 
                  className="text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}