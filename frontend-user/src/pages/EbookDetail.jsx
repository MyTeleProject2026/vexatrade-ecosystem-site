import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEbook, downloadEbook } from '../api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

export default function EbookDetail() {
  const { id } = useParams();
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
    window.open(`${API_BASE_URL}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
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
          <p className="text-[#b0bedb]">The ebook you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isHtmlEbook = ebook.file_type === 'html' || ebook.file_url?.endsWith('.html');

  return (
    <div className="min-h-screen bg-[#0b0f1c]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#07111e] border-b border-[#00d4ff]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
            {/* Cover Image */}
            <div className="w-full lg:w-72 flex-shrink-0">
              {ebook.cover_image_url ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#00d4ff]/20 bg-[#0f1422]">
                  <img 
                    src={ebook.cover_image_url} 
                    alt={ebook.title} 
                    className="w-full aspect-[3/4] object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"><span class="text-6xl">📘</span></div>'; }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#00d4ff]/20 bg-gradient-to-br from-[#0f1422] to-[#0a0e1a] aspect-[3/4] flex items-center justify-center">
                  <span className="text-7xl">📘</span>
                </div>
              )}
            </div>
            
            {/* Ebook Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-xs text-[#00d4ff] mb-4">
                <span>{isHtmlEbook ? '📘 HTML Ebook' : '📕 PDF Document'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                {ebook.title}
              </h1>
              <p className="text-[#b0bedb] text-sm sm:text-base leading-relaxed mb-6">
                {ebook.description || 'No description available.'}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                {isHtmlEbook ? (
                  <button
                    onClick={handleReadOnline}
                    className="inline-flex items-center justify-center gap-2 bg-[#00d4ff] text-black font-semibold px-6 sm:px-8 py-3 rounded-full hover:bg-[#00b8e6] transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#00d4ff]/25"
                  >
                    <span className="text-lg">📖</span>
                    <span>Read Online</span>
                  </button>
                ) : (
                  <button
                    onClick={() => downloadEbook(ebook.id)}
                    className="inline-flex items-center justify-center gap-2 bg-[#00d4ff] text-black font-semibold px-6 sm:px-8 py-3 rounded-full hover:bg-[#00b8e6] transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#00d4ff]/25"
                  >
                    <span className="text-lg">📥</span>
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
              
              {/* Info Box for HTML Ebooks */}
              {isHtmlEbook && (
                <div className="mt-6 p-4 bg-[#0f1422]/50 rounded-xl border border-[#2a3440]">
                  <div className="flex items-start gap-3">
                    <span className="text-[#00d4ff] text-lg">💡</span>
                    <div className="text-left">
                      <p className="text-sm text-[#b0bedb]">
                        This is an interactive HTML ebook. Click <strong>"Read Online"</strong> to view it in your browser with full formatting, images, and styles.
                      </p>
                      <p className="text-xs text-[#6c86a3] mt-2">
                        You can also right-click and save the page to read offline.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Content Section (if needed) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="border-t border-[#2a3440] pt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📋</span> About This Ebook
          </h2>
          <p className="text-[#b0bedb] text-sm sm:text-base leading-relaxed">
            This comprehensive guide provides detailed information about the VexaTrade Blockchain Ecosystem, 
            including trading strategies, investment opportunities, and platform features. 
            Perfect for both beginners and experienced traders.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-[#0f1422] rounded-xl">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-white text-sm font-medium">Secure & Trusted</p>
                <p className="text-xs text-[#6c86a3]">Blockchain verified content</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#0f1422] rounded-xl">
              <span className="text-xl">🔄</span>
              <div>
                <p className="text-white text-sm font-medium">Always Updated</p>
                <p className="text-xs text-[#6c86a3]">Latest platform information</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#0f1422] rounded-xl">
              <span className="text-xl">📱</span>
              <div>
                <p className="text-white text-sm font-medium">Mobile Friendly</p>
                <p className="text-xs text-[#6c86a3]">Read on any device</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#0f1422] rounded-xl">
              <span className="text-xl">💎</span>
              <div>
                <p className="text-white text-sm font-medium">Free Access</p>
                <p className="text-xs text-[#6c86a3]">Included with your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}