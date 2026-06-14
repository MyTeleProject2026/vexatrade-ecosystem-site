import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEbook } from '../api';

export default function EbookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEbook(id)
      .then(res => {
        if (res.data.success) {
          setEbook(res.data.data);
        } else {
          setError('Ebook not found');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load ebook');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReadOnline = () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert('Please login first');
      return;
    }
    // This opens the ebook in a new tab
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
    window.open(`${apiUrl}/api/ebooks/view/${id}?token=${encodeURIComponent(token)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#b0bedb]">Loading ebook...</p>
        </div>
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-white mb-2">Ebook Not Found</h2>
          <p className="text-[#b0bedb]">{error || "The ebook doesn't exist."}</p>
          <button
            onClick={() => navigate('/ebooks')}
            className="mt-4 inline-flex items-center gap-2 text-[#00d4ff] hover:underline"
          >
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-[#b0bedb] hover:text-[#00d4ff] transition mb-6"
      >
        ← Back
      </button>

      <div className="bg-[#0f1422] rounded-2xl overflow-hidden border border-[#2a3440]">
        {ebook.cover_image_url && (
          <div className="h-64 overflow-hidden">
            <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">{ebook.title}</h1>
          <p className="text-[#b0bedb] mb-6">{ebook.description || 'No description available.'}</p>
          
          <button
            onClick={handleReadOnline}
            className="w-full bg-[#00d4ff] text-black font-semibold py-3 rounded-xl hover:bg-[#00b8e6] transition text-lg"
          >
            📖 Read Online Now
          </button>
        </div>
      </div>
    </div>
  );
}