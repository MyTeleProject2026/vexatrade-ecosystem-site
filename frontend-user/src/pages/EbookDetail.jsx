import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEbook } from '../api';

export default function EbookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    getEbook(id)
      .then(res => {
        if (res.data.success) {
          setEbook(res.data.data);
        } else {
          setError('Ebook not found');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load ebook');
      })
      .finally(() => setLoading(false));
  }, [id]);
  
  const handleReadOnline = () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert('Please login first');
      return;
    }
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
    window.open(`${apiUrl}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
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
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-white mb-2">Ebook Not Found</h2>
          <p className="text-[#b0bedb]">{error || "The ebook doesn't exist."}</p>
          <button
            onClick={() => navigate('/ebooks')}
            className="mt-4 inline-flex items-center gap-2 text-[#00d4ff] hover:underline"
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