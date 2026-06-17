import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost } from '../api';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getPost(id)
      .then(res => setPost(res.data.data))
      .catch(console.error)
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
          <p className="text-[#b0bedb]">Loading post...</p>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-white mb-2">Post Not Found</h2>
          <button onClick={() => navigate('/posts')} className="mt-4 text-[#00d4ff] hover:underline">
            ← Back to Posts
          </button>
        </div>
      </div>
    );
  }
  
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

      {post.image_url && (
        <div className="rounded-2xl overflow-hidden mb-8">
          {isInlineSvg(post.image_url) ? (
            <div 
              dangerouslySetInnerHTML={{ __html: getSvgCode(post.image_url) }}
              className="w-full max-h-[400px] flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"
            />
          ) : (
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full max-h-[400px] object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
      <div className="flex items-center gap-2 text-sm text-[#6c86a3] mb-8 pb-6 border-b border-[#2a3440]">
        <span>📅</span>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <div className="prose prose-invert max-w-none prose-p:text-[#b0bedb] prose-headings:text-white">
        <p>{post.description}</p>
        {post.content && <div dangerouslySetInnerHTML={{ __html: post.content }} />}
      </div>
    </article>
  );
}