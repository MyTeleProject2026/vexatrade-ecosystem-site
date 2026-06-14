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

  useEffect(() => {
    if (id) {
      getPost(id).then(res => {
        const post = res.data.data;
        setTitle(post.title);
        setDescription(post.description || '');
        setContent(post.content || '');
        setExistingImage(post.image_url || '');
      }).catch(console.error);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('content', content);
    if (image) formData.append('image', image);
    if (existingImage) formData.append('existing_image_url', existingImage);

    try {
      if (id) {
        await updatePost(id, formData);
      } else {
        await createPost(formData);
      }
      navigate('/posts');
    } catch (err) {
      console.error(err);
      alert('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{id ? 'Edit Post' : 'New Post'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white" required />
        <textarea placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-2 text-white" />
        <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white text-black rounded-lg" />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-white" />
        {existingImage && <img src={existingImage} alt="current" className="h-32 object-contain" />}
        <button type="submit" disabled={loading} className="bg-[#00d4ff] text-black px-6 py-2 rounded-full">Save</button>
      </form>
    </div>
  );
}