import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEbook, downloadEbook } from '../api';

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!ebook) return <div className="p-8 text-center">Ebook not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {ebook.cover_image_url && (
        <img src={ebook.cover_image_url} alt={ebook.title} className="w-full rounded-xl mb-6 max-h-96 object-cover" />
      )}
      <h1 className="text-3xl font-bold text-white mb-4">{ebook.title}</h1>
      <p className="text-[#b0bedb] mb-6">{ebook.description}</p>
      <button
        onClick={() => downloadEbook(ebook.id)}
        className="bg-[#00d4ff] text-black font-semibold px-6 py-2 rounded-full hover:bg-[#00b8e6]"
      >
        📥 Download PDF
      </button>
    </div>
  );
}