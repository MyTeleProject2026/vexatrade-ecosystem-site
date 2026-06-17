import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  // Helper function to check if image is SVG
  const isSvgImage = (url) => {
    if (!url) return false;
    return url.startsWith('data:image/svg+xml') || url.endsWith('.svg');
  };
  
  // Helper function to extract SVG code from data URL
  const getSvgCode = (url) => {
    if (!url || !url.startsWith('data:image/svg+xml')) return '';
    try {
      const svgContent = decodeURIComponent(url.split(',')[1] || '');
      return svgContent;
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="group bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition-all duration-300 hover:transform hover:-translate-y-1">
      {post.image_url && (
        <div className="overflow-hidden h-40 sm:h-48">
          {isSvgImage(post.image_url) ? (
            <div 
              dangerouslySetInnerHTML={{ __html: getSvgCode(post.image_url) }}
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f1422] to-[#0a0e1a]"
            />
          ) : (
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
      )}
      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2">{post.title}</h3>
        <p className="text-xs sm:text-sm text-[#b0bedb] line-clamp-2 mb-3">{post.description}</p>
        <Link 
          to={`/post/${post.id}`} 
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-[#00d4ff] hover:gap-2 transition-all"
        >
          Read more <span>→</span>
        </Link>
      </div>
    </div>
  );
}