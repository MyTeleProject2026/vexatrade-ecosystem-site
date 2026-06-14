import { useEffect, useState } from 'react';
import { getPosts, deletePost } from '../api';
import { Link } from 'react-router-dom';

export default function PostsManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = () => {
    getPosts().then(res => { setPosts(res.data.data || []); setLoading(false); }).catch(console.error);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this post?')) { await deletePost(id); loadPosts(); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <Link to="/posts/new" className="bg-[#00d4ff] text-black px-4 py-2 rounded-full">+ New Post</Link>
      </div>
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">{post.title}</h3>
              <p className="text-sm text-[#b0bedb]">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/posts/edit/${post.id}`} className="text-[#00d4ff] hover:underline">Edit</Link>
              <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}