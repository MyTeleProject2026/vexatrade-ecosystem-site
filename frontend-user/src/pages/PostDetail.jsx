import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPost } from '../api';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPost(id)
      .then(res => setPost(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!post) return <div className="p-8 text-center">Post not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {post.image_url && (
        <img src={post.image_url} alt={post.title} className="w-full rounded-xl mb-6 max-h-96 object-cover" />
      )}
      <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
      <div className="text-[#b0bedb] prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content || post.description }} />
    </div>
  );
}