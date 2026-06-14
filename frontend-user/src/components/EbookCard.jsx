import { Link } from 'react-router-dom';

export default function EbookCard({ ebook }) {
  return (
    <div className="bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition">
      {ebook.cover_image_url && (
        <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-44 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{ebook.title}</h3>
        <p className="text-sm text-[#b0bedb] line-clamp-2">{ebook.description}</p>
        <Link to={`/ebook/${ebook.id}`} className="inline-block mt-3 text-[#00d4ff] hover:underline">View & Download →</Link>
      </div>
    </div>
  );
}