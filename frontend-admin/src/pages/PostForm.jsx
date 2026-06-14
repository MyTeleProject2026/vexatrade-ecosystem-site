import { useEffect, useState, useRef } from 'react';
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
  const [imageType, setImageType] = useState('upload'); // 'upload' or 'svg'
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [svgCode, setSvgCode] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet',
    'link', 'image', 'video'
  ];

  useEffect(() => {
    if (id) {
      getPost(id).then(res => {
        const post = res.data.data;
        setTitle(post.title);
        setDescription(post.description || '');
        setContent(post.content || '');
        setExistingImage(post.image_url || '');
        setImagePreview(post.image_url || '');
        // Detect if existing image is SVG
        if (post.image_url && post.image_url.startsWith('data:image/svg+xml')) {
          setImageType('svg');
          setSvgCode(decodeURIComponent(post.image_url.split(',')[1] || ''));
        }
      }).catch(err => {
        setError('Failed to load post');
      });
    }
  }, [id]);

  // Handle file upload preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Clean up old preview URL when component unmounts or new file selected
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }
  };

  // Handle SVG code input and preview
  const handleSvgChange = (e) => {
    const code = e.target.value;
    setSvgCode(code);
    
    // Create preview from SVG code
    if (code.trim()) {
      const encodedSvg = encodeURIComponent(code);
      const previewUrl = `data:image/svg+xml,${encodedSvg}`;
      setImagePreview(previewUrl);
    } else {
      setImagePreview('');
    }
  };

  // Convert SVG code to data URL for upload
  const getImageDataFromSvg = () => {
    if (!svgCode.trim()) return null;
    const encodedSvg = encodeURIComponent(svgCode);
    return `data:image/svg+xml,${encodedSvg}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (id) {
        // Update existing post
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content', content);
        
        if (imageType === 'upload' && imageFile) {
          formData.append('image', imageFile);
        } else if (imageType === 'svg' && svgCode.trim()) {
          // For SVG, we send the data URL as a string (backend will handle)
          // Since backend expects file upload, we need to adapt
          // Alternative: send as base64 in JSON
          const svgDataUrl = getImageDataFromSvg();
          formData.append('svg_image_url', svgDataUrl);
        }
        
        if (existingImage && !imageFile && !svgCode) {
          formData.append('existing_image_url', existingImage);
        }
        
        await updatePost(id, formData);
      } else {
        // Create new post
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content', content);
        
        if (imageType === 'upload' && imageFile) {
          formData.append('image', imageFile);
        } else if (imageType === 'svg' && svgCode.trim()) {
          // For SVG, we need to create a Blob and upload as file
          const svgBlob = new Blob([svgCode], { type: 'image/svg+xml' });
          const svgFile = new File([svgBlob], 'image.svg', { type: 'image/svg+xml' });
          formData.append('image', svgFile);
        }
        
        await createPost(formData);
      }
      navigate('/posts');
    } catch (err) {
      setError('Failed to save post: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetImageSelection = () => {
    setImageType('upload');
    setImageFile(null);
    setSvgCode('');
    setImagePreview(existingImage || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{id ? 'Edit Post' : 'Create New Post'}</h1>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-[#b0bedb] mb-2">Post Title *</label>
          <input
            type="text"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff] text-lg"
            required
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-[#b0bedb] mb-2">Short Description (Summary)</label>
          <textarea
            placeholder="Brief summary that appears on the homepage card..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff]"
          />
        </div>

        {/* Image Selection Type */}
        <div>
          <label className="block text-sm font-medium text-[#b0bedb] mb-3">Featured Image</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="upload"
                checked={imageType === 'upload'}
                onChange={() => resetImageSelection()}
                className="text-[#00d4ff]"
              />
              <span className="text-white">Upload from Gallery</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="svg"
                checked={imageType === 'svg'}
                onChange={() => {
                  setImageType('svg');
                  setImageFile(null);
                  setImagePreview('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-[#00d4ff]"
              />
              <span className="text-white">Use SVG / HTML Code</span>
            </label>
          </div>

          {/* Upload Image Option */}
          {imageType === 'upload' && (
            <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-white w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00d4ff] file:text-black hover:file:bg-[#00b8e6] cursor-pointer"
              />
              <p className="text-xs text-[#6c86a3] mt-2">Supported formats: JPG, PNG, GIF, WEBP, SVG (max 5MB)</p>
            </div>
          )}

          {/* SVG/HTML Code Option */}
          {imageType === 'svg' && (
            <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
              <label className="block text-sm text-[#b0bedb] mb-2">Paste SVG or HTML Image Code</label>
              <textarea
                placeholder={`<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#00d4ff"/>
  <text x="50%" y="50%" text-anchor="middle" fill="white">VexaTrade</text>
</svg>`}
                value={svgCode}
                onChange={handleSvgChange}
                rows={8}
                className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
              />
              <p className="text-xs text-[#6c86a3] mt-2">Paste valid SVG or HTML image code. Preview will show below.</p>
            </div>
          )}
        </div>

        {/* Image Preview Section */}
        {(imagePreview || (imageType === 'svg' && svgCode)) && (
          <div className="bg-[#0f1422] p-4 rounded-lg border border-[#00d4ff]/30">
            <h3 className="text-sm font-medium text-[#b0bedb] mb-3">Image Preview</h3>
            <div className="flex justify-center p-4 bg-[#131724] rounded-lg min-h-[150px]">
              {imagePreview ? (
                imagePreview.startsWith('data:image/svg+xml') || imagePreview.match(/\.svg/i) ? (
                  <div dangerouslySetInnerHTML={{ __html: decodeURIComponent(imagePreview.split(',')[1] || svgCode) }} />
                ) : (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full max-h-[200px] object-contain rounded"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<p class="text-red-400">Invalid image format</p>'; }}
                  />
                )
              ) : (
                <div className="text-[#6c86a3]">No image to preview</div>
              )}
            </div>
            {imageType === 'svg' && svgCode && (
              <div className="mt-3 text-xs text-[#6c86a3] border-t border-[#2a3440] pt-3">
                <strong>SVG Code Preview:</strong>
                <pre className="mt-2 p-2 bg-[#0a0e1a] rounded overflow-x-auto text-[#b0bedb]">{svgCode.substring(0, 300)}...</pre>
              </div>
            )}
          </div>
        )}

        {/* Rich Text Content Editor */}
        <div>
          <label className="block text-sm font-medium text-[#b0bedb] mb-2">Post Content (HTML supported)</label>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            className="bg-white text-black rounded-lg"
            placeholder="Write your post content here... Use toolbar for formatting, colors, backgrounds, images, videos..."
          />
          <p className="text-xs text-[#6c86a3] mt-2">
            ✅ Supports: Bold, Italic, Colors, Backgrounds, Lists, Links, Images, Videos
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-[#2a3440]">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#00d4ff] text-black font-semibold px-8 py-2 rounded-full hover:bg-[#00b8e6] disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : (id ? 'Update Post' : 'Publish Post')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="border border-[#2a3440] px-6 py-2 rounded-full hover:bg-white/5 transition text-white"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Theme Information */}
      <div className="mt-8 p-4 bg-[#0f1422] rounded-lg border border-[#2a3440]">
        <h3 className="text-sm font-semibold text-[#00d4ff] mb-2">📱 User Website Preview Information</h3>
        <p className="text-xs text-[#b0bedb]">
          On the user website, posts will appear with:
        </p>
        <ul className="text-xs text-[#b0bedb] mt-2 list-disc list-inside">
          <li>Dark theme background (#0b0f1c)</li>
          <li>Blue accent colors (#00d4ff)</li>
          <li>White text for titles, light gray for descriptions (#b0bedb)</li>
          <li>Featured image at top of post page</li>
          <li>Rich text content with your formatting (colors, backgrounds, images, videos)</li>
          <li>Responsive design for mobile and desktop</li>
        </ul>
      </div>
    </div>
  );
}