import { useEffect, useState } from 'react';
import { getPosts, getEbooks } from '../api';
import PostCard from '../components/PostCard';
import EbookCard from '../components/EbookCard';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([getPosts(), getEbooks()])
      .then(([postsRes, ebooksRes]) => {
        setPosts(postsRes.data.data || []);
        setEbooks(ebooksRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#b0bedb]">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Posts Section */}
      <section className="mb-12 sm:mb-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white border-l-4 border-[#00d4ff] pl-3">
            Latest News & Posts
          </h2>
          <div className="h-px flex-1 ml-4 bg-gradient-to-r from-[#00d4ff]/30 to-transparent"></div>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#b0bedb]">No posts yet. Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>

      {/* Ebooks Section */}
      <section>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white border-l-4 border-[#00d4ff] pl-3">
            Ebooks & Guides
          </h2>
          <div className="h-px flex-1 ml-4 bg-gradient-to-r from-[#00d4ff]/30 to-transparent"></div>
        </div>
        
        {ebooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#b0bedb]">No ebooks available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {ebooks.map(ebook => <EbookCard key={ebook.id} ebook={ebook} />)}
          </div>
        )}
      </section>
    </div>
  );
}