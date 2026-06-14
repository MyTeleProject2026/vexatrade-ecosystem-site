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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-[#00d4ff] pl-3">Latest News & Posts</h2>
        {posts.length === 0 ? (
          <p className="text-[#b0bedb]">No posts yet. Check back later.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-[#00d4ff] pl-3">Ebooks & Guides</h2>
        {ebooks.length === 0 ? (
          <p className="text-[#b0bedb]">No ebooks available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.map(ebook => <EbookCard key={ebook.id} ebook={ebook} />)}
          </div>
        )}
      </section>
    </div>
  );
}