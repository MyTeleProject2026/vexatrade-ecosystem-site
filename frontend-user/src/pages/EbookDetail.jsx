import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEbook, downloadEbook } from '../api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';

export default function EbookDetail() {
  const { id } = useParams();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEbook(id)
      .then(res => setEbook(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleReadOnline = () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert('Please login first');
      return;
    }
    window.open(`${API_BASE_URL}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (!ebook) return <div className="p-8 text-center text-white">Ebook not found</div>;

  const isHtmlEbook = ebook.file_type === 'html' || ebook.file_url?.endsWith('.html');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {ebook.cover_image_url && (
        <img src={ebook.cover_image_url} alt={ebook.title} className="w-full rounded-xl mb-6 max-h-96 object-cover" />
      )}
      <h1 className="text-3xl font-bold text-white mb-4">{ebook.title}</h1>
      <p className="text-[#b0bedb] mb-8">{ebook.description}</p>
      
      <div className="flex gap-4">
        {isHtmlEbook ? (
          <button
            onClick={handleReadOnline}
            className="bg-[#00d4ff] text-black font-semibold px-6 py-3 rounded-full hover:bg-[#00b8e6] transition"
          >
            📖 Read Online
          </button>
        ) : (
          <button
            onClick={() => downloadEbook(ebook.id)}
            className="bg-[#00d4ff] text-black font-semibold px-6 py-3 rounded-full hover:bg-[#00b8e6] transition"
          >
            📥 Download PDF
          </button>
        )}
      </div>
    </div>
  );
}