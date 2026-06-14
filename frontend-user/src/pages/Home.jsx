import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getEbooks } from '../api';

export default function Home() {
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentEbooks, setRecentEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, ebooks: 0 });

  useEffect(() => {
    Promise.all([getPosts(), getEbooks()])
      .then(([postsRes, ebooksRes]) => {
        const posts = postsRes.data.data || [];
        const ebooks = ebooksRes.data.data || [];
        setRecentPosts(posts.slice(0, 3));
        setRecentEbooks(ebooks.slice(0, 3));
        setStats({ posts: posts.length, ebooks: ebooks.length });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#b0bedb]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1c]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#07111e] border-b border-[#00d4ff]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-xs text-[#00d4ff] mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Blockchain Ecosystem</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-[#00d4ff] to-[#38bdf8] bg-clip-text text-transparent">
                VexaEcosystem
              </span>
            </h1>
            <p className="text-[#b0bedb] text-base sm:text-lg max-w-2xl mx-auto">
              Your gateway to blockchain news, educational ebooks, and ecosystem updates
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-12 max-w-2xl mx-auto">
            <Link to="/posts" className="group bg-[#0f1422]/50 backdrop-blur-sm rounded-2xl p-6 border border-[#2a3440] hover:border-[#00d4ff] transition-all duration-300 text-center hover:transform hover:-translate-y-1">
              <div className="text-4xl mb-3">📰</div>
              <div className="text-3xl font-bold text-white">{stats.posts}</div>
              <div className="text-sm text-[#b0bedb] mt-1">News & Posts</div>
              <div className="text-xs text-[#00d4ff] mt-3 opacity-0 group-hover:opacity-100 transition">Browse all →</div>
            </Link>
            <Link to="/ebooks" className="group bg-[#0f1422]/50 backdrop-blur-sm rounded-2xl p-6 border border-[#2a3440] hover:border-[#00d4ff] transition-all duration-300 text-center hover:transform hover:-translate-y-1">
              <div className="text-4xl mb-3">📚</div>
              <div className="text-3xl font-bold text-white">{stats.ebooks}</div>
              <div className="text-sm text-[#b0bedb] mt-1">Ebooks & Guides</div>
              <div className="text-xs text-[#00d4ff] mt-3 opacity-0 group-hover:opacity-100 transition">Browse all →</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Latest News</h2>
            <p className="text-sm text-[#6c86a3] mt-1">Recent updates from the ecosystem</p>
          </div>
          <Link to="/posts" className="text-sm text-[#00d4ff] hover:underline flex items-center gap-1">
            View all <span>→</span>
          </Link>
        </div>
        
        {recentPosts.length === 0 ? (
          <div className="text-center py-12 bg-[#0f1422] rounded-2xl">
            <p className="text-[#b0bedb]">No posts yet. Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentPosts.map(post => (
              <Link key={post.id} to={`/post/${post.id}`} className="group bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition-all duration-300 hover:transform hover:-translate-y-1">
                {post.image_url && (
                  <div className="overflow-hidden h-44">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-[#b0bedb] line-clamp-2 mb-3">{post.description}</p>
                  <span className="text-xs text-[#00d4ff]">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ebooks Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-b from-transparent to-[#0f1422]/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Latest Ebooks</h2>
            <p className="text-sm text-[#6c86a3] mt-1">Recently added guides and resources</p>
          </div>
          <Link to="/ebooks" className="text-sm text-[#00d4ff] hover:underline flex items-center gap-1">
            Browse library <span>→</span>
          </Link>
        </div>
        
        {recentEbooks.length === 0 ? (
          <div className="text-center py-12 bg-[#0f1422] rounded-2xl">
            <p className="text-[#b0bedb]">No ebooks available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentEbooks.map(ebook => (
              <Link key={ebook.id} to={`/ebook/${ebook.id}`} className="group bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition-all duration-300 hover:transform hover:-translate-y-1">
                {ebook.cover_image_url ? (
                  <div className="overflow-hidden h-44">
                    <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-[#0f1422] to-[#0a0e1a] flex items-center justify-center">
                    <span className="text-5xl">📘</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#00d4ff]/10 text-[#00d4ff]">
                      {ebook.file_type === 'html' ? 'HTML Ebook' : 'PDF'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">{ebook.title}</h3>
                  <p className="text-sm text-[#b0bedb] line-clamp-2 mb-3">{ebook.description}</p>
                  <span className="text-xs text-[#00d4ff]">View details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}