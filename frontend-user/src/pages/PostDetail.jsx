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
          <p className="text-[#b0bedb]">The post you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 text-[#00d4ff] hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-[#b0bedb] hover:text-[#00d4ff] transition mb-6"
      >
        ← Back
      </button>

      {/* Featured Image */}
      {post.image_url && (
        <div className="rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-xl">
          <img 
            src={post.image_url} 
            alt={post.title} 
            className="w-full max-h-[400px] object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
        {post.title}
      </h1>

      {/* Date */}
      <div className="flex items-center gap-2 text-sm text-[#6c86a3] mb-6 pb-6 border-b border-[#2a3440]">
        <span>📅</span>
        <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* Content */}
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
          prose-ul:text-[#b0bedb]
          prose-ol:text-[#b0bedb]
          prose-li:text-[#b0bedb]
          prose-blockquote:border-l-[#00d4ff] prose-blockquote:text-[#b0bedb] prose-blockquote:bg-[#0f1422] prose-blockquote:p-4 prose-blockquote:rounded-xl"
        dangerouslySetInnerHTML={{ __html: post.content || post.description }}
      />
    </article>
  );
}