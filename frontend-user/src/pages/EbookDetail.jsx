import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEbook, downloadEbook } from '../api';

export default function EbookDetail() {
  const { id } = useParams();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEbook(id).then(res => setEbook(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!ebook) return <div className="p-8 text-center">Ebook not found</div>;

  const isHtmlEbook = ebook.file_type === 'html' || ebook.file_url?.endsWith('.html');
  const viewUrl = isHtmlEbook 
    ? `${import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com'}/api/ebooks/view/${ebook.id}`
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {ebook.cover_image_url && (
        <img src={ebook.cover_image_url} alt={ebook.title} className="w-full rounded-xl mb-6 max-h-96 object-cover" />
      )}
      <h1 className="text-3xl font-bold text-white mb-4">{ebook.title}</h1>
      <p className="text-[#b0bedb] mb-6">{ebook.description}</p>
      
      <div className="flex gap-4">
        {isHtmlEbook ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#00d4ff] text-black font-semibold px-6 py-2 rounded-full hover:bg-[#00b8e6]"
          >
            📖 Read Online
          </a>
        ) : (
          <button
            onClick={() => downloadEbook(ebook.id)}
            className="bg-[#00d4ff] text-black font-semibold px-6 py-2 rounded-full hover:bg-[#00b8e6]"
          >
            📥 Download PDF
          </button>
        )}
      </div>
      
      {isHtmlEbook && (
        <div className="mt-6 p-4 bg-[#0f1422] rounded-lg border border-[#2a3440]">
          <h3 className="text-sm font-semibold text-[#00d4ff] mb-2">📘 HTML Ebook</h3>
          <p className="text-xs text-[#b0bedb]">
            Click "Read Online" to view the ebook in your browser. You can also right-click and save the page.
          </p>
        </div>
      )}
    </div>
  );
}