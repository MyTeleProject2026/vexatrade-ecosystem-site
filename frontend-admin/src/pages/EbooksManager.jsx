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
  
  // ✅ SAFE: Check if image is SVG
  const isSvgImage = (url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    return url.startsWith('data:image/svg+xml') || url.endsWith('.svg');
  };
  
  // ✅ SAFE: Extract SVG code from data URL
  const getSvgCode = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (!url.startsWith('data:image/svg+xml')) return '';
    
    try {
      const svgContent = decodeURIComponent(url.split(',')[1] || '');
      return svgContent;
    } catch (e) {
      console.warn('Failed to decode SVG:', e);
      return '';
    }
  };
  
  // ✅ SAFE: Render image with proper error handling
  const renderEbookImage = (ebook) => {
    const url = ebook.cover_image_url;
    const title = ebook.title || 'Ebook';
    
    // No image URL
    if (!url) {
      return <span className="text-2xl">📘</span>;
    }
    
    // ✅ Check if it's a valid SVG
    if (isSvgImage(url)) {
      const svgCode = getSvgCode(url);
      
      // If we have valid SVG code, render it
      if (svgCode && svgCode.includes('<svg')) {
        return (
          <div 
            className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex items-center justify-center flex-shrink-0"
            dangerouslySetInnerHTML={{ __html: svgCode }}
          />
        );
      }
      
      // Fallback for invalid SVG
      return (
        <div className="w-12 h-12 rounded bg-[#0a0e1a] flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📘</span>
        </div>
      );
    }
    
    // ✅ Regular image (JPG, PNG, etc.)
    return (
      <div className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex-shrink-0">
        <img 
          src={url} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
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
                {/* ✅ FIXED: Safe image rendering */}
                {renderEbookImage(ebook)}
                
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