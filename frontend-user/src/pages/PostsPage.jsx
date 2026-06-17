import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts } from '../api';

export default function PostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    getPosts()
      .then(res => {
        const data = res.data.data || [];
        setPosts(data);
        setFilteredPosts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    let results = posts;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(post =>
        post.title.toLowerCase().includes(query) ||
        (post.description && post.description.toLowerCase().includes(query))
      );
    }
    setFilteredPosts(results);
  }, [searchQuery, posts]);
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
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
          <div className="inline-block w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#b0bedb]">Loading posts...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0b0f1c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-[#b0bedb] hover:text-[#00d4ff] transition text-sm">
          ← Back to Home
        </button>
      </div>

      <div className="bg-gradient-to-r from-[#0a0e1a] to-[#0f172a] border-b border-[#00d4ff]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">News & Posts</h1>
          <p className="text-[#b0bedb] text-sm sm:text-base">Stay updated with the latest news from the VexaTrade Ecosystem</p>
        </div>
      </div>

      <div className="sticky top-16 z-40 bg-[#0b0f1c]/95 backdrop-blur-sm border-b border-[#1e2a3a] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search posts by title or description..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-[#0f1422] border border-[#2a3440] rounded-xl pl-4 pr-10 py-2.5 text-white placeholder-[#6c86a3] focus:outline-none focus:border-[#00d4ff] transition"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6c86a3] hover:text-white">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-sm text-[#6c86a3]">
          Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-[#0f1422] rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">No posts found</h3>
            <p className="text-[#b0bedb] text-sm">
              {searchQuery ? `No posts matching "${searchQuery}"` : 'No posts available yet'}
            </p>
            {searchQuery && (
              <button onClick={clearSearch} className="mt-4 text-[#00d4ff] hover:underline text-sm">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredPosts.map(post => (
              <div key={post.id} className="group bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition-all duration-300 hover:transform hover:-translate-y-1 flex flex-col">
                <Link to={`/post/${post.id}`} className="block">
                  {post.image_url && (
                    <div className="overflow-hidden h-48">
                      {isInlineSvg(post.image_url) ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: getSvgCode(post.image_url) }}
                          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"
                        />
                      ) : (
                        <img 
                          src={post.image_url} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"><span class="text-4xl">📄</span></div>';
                          }}
                        />
                      )}
                    </div>
                  )}
                </Link>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-xs text-[#6c86a3] mb-2">
                    <span>📅</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/post/${post.id}`} className="block">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-[#00d4ff] transition">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-[#b0bedb] line-clamp-3 mb-4 flex-grow">
                    {post.description}
                  </p>
                  <Link 
                    to={`/post/${post.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#00d4ff] to-[#00b8e6] text-black font-bold px-4 py-2.5 rounded-lg hover:from-[#00b8e6] hover:to-[#0099cc] transition-all duration-300 text-sm shadow-lg hover:shadow-[#00d4ff]/20"
                  >
                    📖 Read Article
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}