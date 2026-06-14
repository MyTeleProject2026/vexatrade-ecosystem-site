import { useEffect, useState } from 'react';
import { getPosts, deletePost } from '../api';
import { Link } from 'react-router-dom';

export default function PostsManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    try {
      const res = await getPosts();
      setPosts(res.data.data || []);
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await deletePost(id);
      loadPosts();
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) return <div className="p-6 text-white">Loading posts...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <Link to="/posts/new" className="bg-[#00d4ff] text-black px-4 py-2 rounded-full hover:bg-[#00b8e6]">+ New Post</Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-[#b0bedb]">No posts yet. Create your first post.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                <p className="text-sm text-[#b0bedb]">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-3">
                <Link to={`/posts/edit/${post.id}`} className="text-[#00d4ff] hover:underline">Edit</Link>
                <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}