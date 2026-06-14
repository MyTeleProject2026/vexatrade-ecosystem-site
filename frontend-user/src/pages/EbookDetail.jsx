import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEbook, downloadEbook, viewEbook } from '../api';

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
    viewEbook(id);
  };

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (!ebook) return <div className="p-8 text-center text-white">Ebook not found</div>;

  const isHtmlEbook = ebook.file_type === 'html' || ebook.file_url?.endsWith('.html');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {ebook.cover_image_url && (
        <img 
          src={ebook.cover_image_url} 
          alt={ebook.title} 
          className="w-full rounded-xl mb-6 max-h-96 object-cover border border-[#2a3440]"
        />
      )}
      <h1 className="text-3xl font-bold text-white mb-4">{ebook.title}</h1>
      <p className="text-[#b0bedb] mb-8 leading-relaxed">{ebook.description}</p>
      
      <div className="flex flex-wrap gap-4">
        {isHtmlEbook ? (
          <button
            onClick={handleReadOnline}
            className="bg-[#00d4ff] text-black font-semibold px-6 py-3 rounded-full hover:bg-[#00b8e6] transition flex items-center gap-2"
          >
            <span>📖</span> Read Online
          </button>
        ) : (
          <button
            onClick={() => downloadEbook(ebook.id)}
            className="bg-[#00d4ff] text-black font-semibold px-6 py-3 rounded-full hover:bg-[#00b8e6] transition flex items-center gap-2"
          >
            <span>📥</span> Download PDF
          </button>
        )}
      </div>
      
      {isHtmlEbook && (
        <div className="mt-8 p-5 bg-[#0f1422] rounded-xl border border-[#2a3440]">
          <h3 className="text-sm font-semibold text-[#00d4ff] mb-2 flex items-center gap-2">
            <span>📘</span> About This HTML Ebook
          </h3>
          <p className="text-sm text-[#b0bedb]">
            This ebook is an interactive HTML document. Click "Read Online" to view it in your browser with full formatting, images, and styles.
            You can also save the page to read offline.
          </p>
        </div>
      )}
    </div>
  );
}