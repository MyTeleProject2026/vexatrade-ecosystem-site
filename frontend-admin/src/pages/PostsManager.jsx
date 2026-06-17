import { useEffect, useState } from 'react';
import { getPosts, deletePost } from '../api';
import { Link } from 'react-router-dom';

export default function PostsManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await getPosts();
      if (res && res.data && res.data.success) {
        setPosts(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPosts();
  }, []);
  
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(id);
      await loadPosts();
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };
  
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
  
  const renderPostImage = (post) => {
    if (!post) return null;
    const url = post.image_url;
    if (!url || typeof url !== 'string') return null;
    
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
          <img src={url} alt={post.title} className="w-full h-full object-contain" />
        </div>
      );
    }
    
    return (
      <div className="w-12 h-12 rounded overflow-hidden bg-[#0a0e1a] flex-shrink-0">
        <img 
          src={url} 
          alt={post.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg">
          ❌ {error}
          <button onClick={loadPosts} className="ml-4 text-[#00d4ff] hover:underline">Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <Link to="/posts/new" className="bg-[#00d4ff] text-black px-4 py-2 rounded-full hover:bg-[#00b8e6] transition">
          + New Post
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-12 bg-[#0f1422] rounded-xl">
          <p className="text-[#b0bedb]">No posts yet. Create your first post.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            if (!post || !post.id) return null;
            return (
              <div key={post.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center flex-wrap gap-2 hover:border-[#00d4ff] border border-transparent transition">
                <div className="flex items-center gap-3 min-w-[200px]">
                  {renderPostImage(post)}
                  <div className="flex-1 min-w-[100px]">
                    <h3 className="text-lg font-semibold text-white truncate max-w-[300px]">
                      {post.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-[#b0bedb]">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'No date'}
                    </p>
                    {post.is_html_mode && <span className="text-xs text-[#00d4ff]">HTML Mode</span>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/posts/edit/${post.id}`} className="text-[#00d4ff] hover:underline text-sm">Edit</Link>
                  <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:underline text-sm">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}