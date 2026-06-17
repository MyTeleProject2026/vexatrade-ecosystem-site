import { useEffect, useState } from 'react';
import { getEbooks, deleteEbook } from '../api';
import { Link } from 'react-router-dom';

export default function EbooksManager() {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const loadEbooks = async () => {
    try {
      setLoading(true);
      const res = await getEbooks();
      if (res && res.data && res.data.success) {
        setEbooks(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setEbooks([]);
      }
    } catch (err) {
      console.error('Error loading ebooks:', err);
      setError('Failed to load ebooks: ' + (err.message || 'Unknown error'));
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
      await loadEbooks();
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };
  
  // ✅ FIXED: View ebook – uses view endpoint with admin token as query param
  const handleViewEbook = (ebook) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Please login as admin first');
        return;
      }
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
      // Open the view endpoint with token as query param
      window.open(`${apiUrl}/api/ebooks/view/${ebook.id}?token=${encodeURIComponent(token)}`, '_blank');
    } catch (err) {
      console.error('View error:', err);
      alert('Failed to view ebook');
    }
  };
  
  // ✅ FIXED: Download ebook – uses download API endpoint for HTML ebooks
  const handleDownloadEbook = (ebook) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Please login as admin first');
        return;
      }
      if (ebook.file_type === 'html' || (ebook.file_url && ebook.file_url.endsWith('.html'))) {
        // For HTML ebooks, use the download API endpoint
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
        window.open(`${apiUrl}/api/ebooks/download/${ebook.id}?token=${encodeURIComponent(token)}`, '_blank');
      } else if (ebook.file_url) {
        // For PDF, open the file URL directly
        window.open(ebook.file_url, '_blank');
      } else {
        alert('No file URL available');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download ebook');
    }
  };
  
  // Safe SVG detection
  const isSvgImage = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('data:image/svg+xml') || url.endsWith('.svg');
  };
  
  const getSvgCode = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (!url.startsWith('data:image/svg+xml')) return '';
    try {
      const parts = url.split(',');
      if (parts.length < 2) return '';
      return decodeURIComponent(parts[1] || '');
    } catch {
      return '';
    }
  };
  
  const renderEbookImage = (ebook) => {
    if (!ebook) return <span className="text-2xl">📘</span>;
    const url = ebook.cover_image_url;
    if (!url || typeof url !== 'string') return <span className="text-2xl">📘</span>;
    
    if (isSvgImage(url)) {
      const svgCode = getSvgCode(url);
      if (svgCode && svgCode.includes('<svg') && svgCode.includes('</svg>')) {
        return (
          <div 
            className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex items-center justify-center flex-shrink-0"
            dangerouslySetInnerHTML={{ __html: svgCode }}
          />
        );
      }
      return (
        <div className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex-shrink-0">
          <img src={url} alt={ebook.title} className="w-full h-full object-contain" />
        </div>
      );
    }
    
    return (
      <div className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex-shrink-0">
        <img 
          src={url} 
          alt={ebook.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = '<span class="text-2xl">📘</span>';
          }}
        />
      </div>
    );
  };
  
  const getFileIcon = (ebook) => {
    if (!ebook) return '📄';
    if (ebook.file_type === 'html') return '📘';
    if (ebook.file_type === 'pdf') return '📕';
    return '📄';
  };
  
  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading ebooks...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg">
          ❌ {error}
          <button onClick={loadEbooks} className="ml-4 text-[#00d4ff] hover:underline">Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Ebooks & Guides</h1>
        <Link to="/ebooks/new" className="bg-[#00d4ff] text-black px-4 py-2 rounded-full hover:bg-[#00b8e6] transition">
          + New Ebook
        </Link>
      </div>

      {!ebooks || ebooks.length === 0 ? (
        <div className="text-center py-12 bg-[#0f1422] rounded-xl">
          <p className="text-[#b0bedb]">No ebooks yet. Create your first ebook.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ebooks.map((ebook) => {
            if (!ebook || !ebook.id) return null;
            return (
              <div key={ebook.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center flex-wrap gap-3 hover:border-[#00d4ff] border border-transparent transition">
                <div className="flex items-center gap-3 min-w-[200px]">
                  {renderEbookImage(ebook)}
                  <div className="flex-1 min-w-[100px]">
                    <h3 className="text-lg font-semibold text-white truncate max-w-[300px]">
                      {ebook.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-[#b0bedb] truncate max-w-[300px]">
                      {ebook.description?.slice(0, 100) || 'No description'}
                    </p>
                    <p className="text-xs text-[#6c86a3] mt-1">
                      {ebook.file_type === 'html' ? '📘 HTML Ebook' : ebook.file_type === 'pdf' ? '📕 PDF Document' : '📄 Document'}
                      {ebook.is_html_mode && ' • HTML Mode'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link to={`/ebooks/edit/${ebook.id}`} className="text-[#00d4ff] hover:underline text-sm">Edit</Link>
                  <button onClick={() => handleViewEbook(ebook)} className="text-[#00d4ff] hover:underline text-sm">View</button>
                  <button onClick={() => handleDownloadEbook(ebook)} className="text-[#00d4ff] hover:underline text-sm">Download</button>
                  <button onClick={() => handleDelete(ebook.id)} className="text-red-400 hover:underline text-sm">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 