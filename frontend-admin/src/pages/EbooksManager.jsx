import { useEffect, useState } from 'react';
import { getEbooks, deleteEbook, createEbook } from '../api';

export default function EbooksManager() {
  const [ebooks, setEbooks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEbooks = async () => {
    try {
      const res = await getEbooks();
      setEbooks(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEbooks();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setError('Title and PDF file are required');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (cover) formData.append('cover', cover);
    formData.append('file', file);
    try {
      await createEbook(formData);
      setTitle('');
      setDescription('');
      setCover(null);
      setFile(null);
      loadEbooks();
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ebook?')) return;
    try {
      await deleteEbook(id);
      loadEbooks();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Manage Ebooks</h1>
      <form onSubmit={handleUpload} className="bg-[#0f1422] p-5 rounded-xl mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">Upload New Ebook</h2>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <input
          type="text"
          placeholder="Ebook Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00d4ff]"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-2 text-white"
        />
        <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} className="text-white" />
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="text-white" required />
        <button type="submit" disabled={loading} className="bg-[#00d4ff] text-black px-5 py-2 rounded-full hover:bg-[#00b8e6] disabled:opacity-50">
          {loading ? 'Uploading...' : 'Upload Ebook'}
        </button>
      </form>

      <h2 className="text-xl font-semibold text-white mb-4">Existing Ebooks</h2>
      {ebooks.length === 0 ? (
        <p className="text-[#b0bedb]">No ebooks uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {ebooks.map((ebook) => (
            <div key={ebook.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-semibold text-white">{ebook.title}</h3>
                <p className="text-sm text-[#b0bedb]">{ebook.description?.slice(0, 100)}</p>
              </div>
              <button onClick={() => handleDelete(ebook.id)} className="text-red-400 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}