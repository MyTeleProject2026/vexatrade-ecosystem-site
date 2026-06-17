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
          setTimeout(() => window.location.href = '/', 2000);
        } else if (err.response?.status === 404) {
          setError('Ebook not found');
        } else {
          setError('Failed to load ebook. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);
  
  // ✅ Helper: Check if it's an inline SVG data URI
  const isInlineSvg = (url) => {
    return url && typeof url === 'string' && url.startsWith('data:image/svg+xml');
  };
  
  // ✅ Helper: Extract SVG code from data URI
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
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {error?.includes('login') || error?.includes('Session') ? 'Authentication Required' : 'Ebook Not Found'}
          </h2>
          <p className="text-[#b0bedb]">{error || "The ebook doesn't exist."}</p>
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
          <button onClick={() => navigate('/ebooks')} className="mt-4 ml-2 inline-flex items-center gap-2 text-[#00d4ff] hover:underline">
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }
  
  const isHtmlEbook = ebook.file_type === 'html' || ebook.is_html_mode;
  
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-[#b0bedb] hover:text-[#00d4ff] transition text-sm">
          ← Back to Home
        </button>
        <span className="text-[#2a3440]">|</span>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[#b0bedb] hover:text-[#00d4ff] transition text-sm">
          ← Back
        </button>
      </div>

      {/* Cover Image – fixed */}
      {ebook.cover_image_url && (
        <div className="rounded-2xl overflow-hidden mb-8">
          {isInlineSvg(ebook.cover_image_url) ? (
            <div 
              dangerouslySetInnerHTML={{ __html: getSvgCode(ebook.cover_image_url) }}
              className="w-full max-h-[400px] flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"
            />
          ) : (
            <img 
              src={ebook.cover_image_url} 
              alt={ebook.title} 
              className="w-full max-h-[400px] object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      <h1 className="text-3xl font-bold text-white mb-4">{ebook.title}</h1>
      <div className="flex items-center gap-2 mb-6 pb-6 border-b border-[#2a3440]">
        <span className="text-xs px-3 py-1 rounded-full bg-[#00d4ff]/10 text-[#00d4ff]">
          {isHtmlEbook ? '📘 HTML Ebook' : '📕 PDF Document'}
        </span>
      </div>

      {isHtmlEbook && ebook.content ? (
        <div 
          className="prose prose-invert max-w-none 
            prose-headings:text-white prose-headings:font-semibold
            prose-h1:text-2xl prose-h1:sm:text-3xl
            prose-h2:text-xl prose-h2:sm:text-2xl
            prose-p:text-[#b0bedb] prose-p:text-sm prose-p:sm:text-base
            prose-a:text-[#00d4ff] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-[#00d4ff] prose-code:bg-[#1e293b] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-[#0f1422] prose-pre:border prose-pre:border-[#2a3440]
            prose-img:rounded-xl prose-img:mx-auto
            prose-ul:text-[#b0bedb] prose-ol:text-[#b0bedb] prose-li:text-[#b0bedb]
            prose-blockquote:border-l-[#00d4ff] prose-blockquote:text-[#b0bedb] prose-blockquote:bg-[#0f1422] prose-blockquote:p-4 prose-blockquote:rounded-xl"
          dangerouslySetInnerHTML={{ __html: ebook.content }}
        />
      ) : ebook.file_url && ebook.file_url.endsWith('.pdf') ? (
        <div className="bg-[#0f1422] rounded-xl p-8 text-center border border-[#2a3440]">
          <div className="text-6xl mb-4">📕</div>
          <h3 className="text-xl font-semibold text-white mb-2">PDF Document</h3>
          <p className="text-[#b0bedb] mb-6">This is a PDF document. You can download it or view it online.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={ebook.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#00d4ff] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#00b8e6] transition">
              📖 View PDF
            </a>
            <a href={ebook.file_url} download className="inline-flex items-center justify-center gap-2 bg-[#0f1422] border border-[#2a3440] text-white font-bold px-6 py-3 rounded-lg hover:border-[#00d4ff] transition">
              ⬇️ Download PDF
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f1422] rounded-xl p-8 text-center border border-[#2a3440]">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-[#b0bedb] mb-6">{ebook.description || 'No content available.'}</p>
          {ebook.file_url && (
            <a href={ebook.file_url} download className="inline-flex items-center justify-center gap-2 bg-[#00d4ff] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#00b8e6] transition">
              ⬇️ Download Ebook
            </a>
          )}
        </div>
      )}
    </article>
  );
}