import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEbook, viewEbook } from '../api';

export default function EbookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      setError('Please login to view this ebook');
      setLoading(false);
      return;
    }
    
    getEbook(id)
      .then(res => {
        if (res.data.success) {
          setEbook(res.data.data);
        } else {
          setError('Ebook not found');
        }
      })
      .catch(err => {
        console.error('Error loading ebook:', err);
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('userToken');
          localStorage.removeItem('userEmail');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (err.response?.status === 404) {
          setError('Ebook not found');
        } else {
          setError('Failed to load ebook. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);
  
  const handleReadOnline = () => {
    viewEbook(id);
  };
  
  // Helper function to check if image is SVG
  const isSvgImage = (url) => {
    if (!url) return false;
    return url.startsWith('data:image/svg+xml') || url.endsWith('.svg');
  };
  
  // Helper function to extract SVG code from data URL
  const getSvgCode = (url) => {
    if (!url || !url.startsWith('data:image/svg+xml')) return '';
    try {
      const svgContent = decodeURIComponent(url.split(',')[1] || '');
      return svgContent;
    } catch (e) {
      return '';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#b0bedb]">Loading ebook...</p>
        </div>
      </div>
    );
  }
  
  if (error || !ebook) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {error?.includes('login') || error?.includes('Session') ? 'Authentication Required' : 'Ebook Not Found'}
          </h2>
          <p className="text-[#b0bedb]">
            {error || "The ebook doesn't exist."}
          </p>
          {(error?.includes('login') || error?.includes('Session')) && (
            <button
              onClick={() => {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userEmail');
                window.location.href = '/';
              }}
              className="mt-4 inline-flex items-center gap-2 bg-[#00d4ff] text-black px-6 py-2 rounded-full hover:bg-[#00b8e6] transition"
            >
              🔐 Login Again
            </button>
          )}
          <button
            onClick={() => navigate('/ebooks')}
            className="mt-4 ml-2 inline-flex items-center gap-2 text-[#00d4ff] hover:underline"
          >
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-[#b0bedb] hover:text-[#00d4ff] transition mb-6"
      >
        ← Back
      </button>

      <div className="bg-[#0f1422] rounded-2xl overflow-hidden border border-[#2a3440]">
        {ebook.cover_image_url && (
          <div className="h-64 overflow-hidden">
            {isSvgImage(ebook.cover_image_url) ? (
              <div 
                dangerouslySetInnerHTML={{ __html: getSvgCode(ebook.cover_image_url) }}
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"
              />
            ) : (
              <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover" />
            )}
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">{ebook.title}</h1>
          <p className="text-[#b0bedb] mb-6">{ebook.description || 'No description available.'}</p>
          
          <button
            onClick={handleReadOnline}
            className="w-full bg-[#00d4ff] text-black font-semibold py-3 rounded-xl hover:bg-[#00b8e6] transition text-lg"
          >
            📖 Read Online Now
          </button>
        </div>
      </div>
    </div>
  );
}