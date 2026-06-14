import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <div className="bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition">
      {post.image_url && (
        <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
        <p className="text-sm text-[#b0bedb] line-clamp-2">{post.description}</p>
        <Link to={`/post/${post.id}`} className="inline-block mt-3 text-[#00d4ff] hover:underline">Read more →</Link>
      </div>
    </div>
  );
}