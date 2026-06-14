import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, createPost, updatePost } from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      getPost(id)
        .then((res) => {
          const post = res.data.data;
          setTitle(post.title);
          setDescription(post.description || '');
          setContent(post.content || '');
          setExistingImage(post.image_url || '');
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load post');
        });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('content', content);
    if (image) formData.append('image', image);
    if (existingImage) formData.append('existing_image_url', existingImage);
    try {
      if (id) await updatePost(id, formData);
      else await createPost(formData);
      navigate('/posts');
    } catch (err) {
      setError('Failed to save post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{id ? 'Edit Post' : 'New Post'}</h1>
      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00d4ff]"
          required
        />
        <textarea
          placeholder="Short description (summary)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00d4ff]"
        />
        <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white text-black rounded-lg" />
        <div>
          <label className="block text-sm text-[#b0bedb] mb-1">Featured Image</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-white" />
          {existingImage && !image && <img src={existingImage} alt="Current" className="h-24 mt-2 rounded object-cover" />}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-[#00d4ff] text-black px-6 py-2 rounded-full hover:bg-[#00b8e6] disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Post'}
          </button>
          <button type="button" onClick={() => navigate('/posts')} className="border border-[#2a3440] px-6 py-2 rounded-full hover:bg-white/5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}