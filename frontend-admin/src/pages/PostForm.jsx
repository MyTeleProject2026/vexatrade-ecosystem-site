import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, createPost, updatePost } from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Post creation mode: 'normal' or 'html'
  const [postMode, setPostMode] = useState('normal'); // 'normal' or 'html'
  
  // Normal mode fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageType, setImageType] = useState('upload'); // 'upload' or 'svg'
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [svgCode, setSvgCode] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  // HTML mode fields
  const [htmlTitle, setHtmlTitle] = useState('');
  const [htmlDescription, setHtmlDescription] = useState('');
  const [htmlContentCode, setHtmlContentCode] = useState('');
  const [htmlImageCode, setHtmlImageCode] = useState('');
  const [htmlImagePreview, setHtmlImagePreview] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [svgError, setSvgError] = useState('');
  const fileInputRef = useRef(null);

  // Quill modules configuration for normal mode
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

  // ✅ ENHANCED SVG validation with HTML detection
  const validateSvg = (code) => {
    if (!code || typeof code !== 'string') return { valid: false, error: 'No code provided' };
    const trimmed = code.trim();
    if (!trimmed) return { valid: false, error: 'Empty code' };

    // Check for HTML content
    if (trimmed.includes('<!DOCTYPE') || trimmed.includes('<html') || trimmed.includes('<head') || trimmed.includes('<meta')) {
      return { valid: false, error: '⚠️ HTML content detected – please use SVG only for images' };
    }

    if (!trimmed.includes('<svg')) {
      return { valid: false, error: 'Missing <svg> tag' };
    }
    if (!trimmed.includes('</svg>')) {
      return { valid: false, error: 'Missing closing </svg> tag' };
    }
    if (!trimmed.includes('xmlns')) {
      return { valid: false, error: 'Missing xmlns attribute (add xmlns="http://www.w3.org/2000/svg")' };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return { valid: false, error: parserError.textContent };
      }
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  };

  // Load existing post for editing
  useEffect(() => {
    if (id) {
      getPost(id).then(res => {
        const post = res.data.data;
        
        // Detect if this is an HTML mode post
        if (post.is_html_mode || (post.content && post.content.includes('<!DOCTYPE') || post.content.includes('<html'))) {
          setPostMode('html');
          setHtmlTitle(post.title);
          setHtmlDescription(post.description || '');
          setHtmlContentCode(post.content || '');
          setHtmlImageCode(post.image_url || '');
          setHtmlImagePreview(post.image_url || '');
        } else {
          setPostMode('normal');
          setTitle(post.title);
          setDescription(post.description || '');
          setContent(post.content || '');
          setExistingImage(post.image_url || '');
          setImagePreview(post.image_url || '');
          
          if (post.image_url && post.image_url.startsWith('data:image/svg+xml')) {
            setImageType('svg');
            setSvgCode(decodeURIComponent(post.image_url.split(',')[1] || ''));
          }
        }
      }).catch(err => {
        setError('Failed to load post');
      });
    }
  }, [id]);

  // Handle normal mode file upload preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }
  };

  // Handle normal mode SVG code input - with validation
  const handleSvgChange = (e) => {
    const code = e.target.value;
    setSvgCode(code);
    setSvgError('');
    
    if (code.trim()) {
      const validation = validateSvg(code);
      if (validation.valid) {
        try {
          const encodedSvg = encodeURIComponent(code)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22')
            .replace(/#/g, '%23');
          const previewUrl = `data:image/svg+xml,${encodedSvg}`;
          setImagePreview(previewUrl);
        } catch (error) {
          setSvgError('Error encoding SVG: ' + error.message);
          setImagePreview('');
        }
      } else {
        setSvgError('Invalid SVG: ' + validation.error);
        setImagePreview('');
      }
    } else {
      setImagePreview('');
    }
  };

  // Handle HTML mode image code preview - with validation
  const handleHtmlImageCodeChange = (e) => {
    const code = e.target.value;
    setHtmlImageCode(code);
    setSvgError('');
    
    if (code.trim()) {
      if (code.includes('<svg')) {
        const validation = validateSvg(code);
        if (validation.valid) {
          try {
            const encodedSvg = encodeURIComponent(code)
              .replace(/'/g, '%27')
              .replace(/"/g, '%22')
              .replace(/#/g, '%23');
            const previewUrl = `data:image/svg+xml,${encodedSvg}`;
            setHtmlImagePreview(previewUrl);
          } catch (error) {
            setSvgError('Error encoding SVG: ' + error.message);
            setHtmlImagePreview('');
          }
        } else {
          setSvgError('Invalid SVG: ' + validation.error);
          setHtmlImagePreview('');
        }
      } else if (code.startsWith('data:image')) {
        setHtmlImagePreview(code);
      } else if (code.includes('<img')) {
        setHtmlImagePreview(code);
      } else {
        setHtmlImagePreview('');
      }
    } else {
      setHtmlImagePreview('');
    }
  };

  const resetNormalMode = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setImageType('upload');
    setImageFile(null);
    setSvgCode('');
    setImagePreview('');
    setSvgError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetHtmlMode = () => {
    setHtmlTitle('');
    setHtmlDescription('');
    setHtmlContentCode('');
    setHtmlImageCode('');
    setHtmlImagePreview('');
    setSvgError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (postMode === 'normal') {
        // NORMAL MODE SUBMISSION
        if (!title.trim()) {
          setError('Title is required');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content', content);
        formData.append('is_html_mode', 'false');

        if (imageType === 'upload' && imageFile) {
          formData.append('image', imageFile);
        } else if (imageType === 'svg' && svgCode.trim()) {
          // Validate SVG before sending
          const validation = validateSvg(svgCode);
          if (!validation.valid) {
            setError('Invalid SVG: ' + validation.error);
            setLoading(false);
            return;
          }
          
          let cleanSvg = svgCode.trim();
          if (!cleanSvg.includes('xmlns')) {
            cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          
          const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml' });
          const svgFile = new File([svgBlob], 'image.svg', { type: 'image/svg+xml' });
          formData.append('image', svgFile);
        }

        if (id) {
          await updatePost(id, formData);
          setSuccess('Post updated successfully!');
        } else {
          await createPost(formData);
          setSuccess('Post created successfully!');
          resetNormalMode();
        }
      } 
      else if (postMode === 'html') {
        // HTML MODE SUBMISSION
        if (!htmlTitle.trim()) {
          setError('Title is required for HTML mode');
          setLoading(false);
          return;
        }

        if (!htmlContentCode.trim()) {
          setError('HTML content code is required');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', htmlTitle);
        formData.append('description', htmlDescription);
        
        // Wrap HTML content in a complete document structure
        let fullHtmlContent = htmlContentCode;
        if (!htmlContentCode.includes('<!DOCTYPE') && !htmlContentCode.includes('<html')) {
          fullHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #e0e0e0;
      background-color: #0b0f1c;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #ffffff; }
    a { color: #00d4ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre, code { background-color: #1e293b; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  ${htmlContentCode}
</body>
</html>`;
        }
        
        formData.append('content', fullHtmlContent);
        formData.append('is_html_mode', 'true');
        
        // Handle HTML image code
        if (htmlImageCode.trim()) {
          if (htmlImageCode.includes('<svg')) {
            // Validate SVG
            const validation = validateSvg(htmlImageCode);
            if (!validation.valid) {
              setError('Invalid SVG: ' + validation.error);
              setLoading(false);
              return;
            }
            
            let cleanSvg = htmlImageCode.trim();
            if (!cleanSvg.includes('xmlns')) {
              cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            
            const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml' });
            const svgFile = new File([svgBlob], 'image.svg', { type: 'image/svg+xml' });
            formData.append('image', svgFile);
          } else if (htmlImageCode.startsWith('data:image')) {
            formData.append('image_url_data', htmlImageCode);
          } else {
            formData.append('image_code', htmlImageCode);
          }
        }

        if (id) {
          await updatePost(id, formData);
          setSuccess('HTML post updated successfully!');
        } else {
          await createPost(formData);
          setSuccess('HTML post created successfully!');
          resetHtmlMode();
        }
      }

      // Redirect after 2 seconds on success
      setTimeout(() => {
        navigate('/posts');
      }, 2000);
      
    } catch (err) {
      setError('Failed to save post: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">{id ? 'Edit Post' : 'Create New Post'}</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setPostMode('normal');
              resetHtmlMode();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              postMode === 'normal' 
                ? 'bg-[#00d4ff] text-black' 
                : 'bg-[#0f1422] text-[#b0bedb] border border-[#2a3440] hover:border-[#00d4ff]'
            }`}
          >
            📝 Normal Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setPostMode('html');
              resetNormalMode();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              postMode === 'html' 
                ? 'bg-[#00d4ff] text-black' 
                : 'bg-[#0f1422] text-[#b0bedb] border border-[#2a3440] hover:border-[#00d4ff]'
            }`}
          >
            💻 HTML Code Mode
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-lg mb-4">
          ✅ {success} Redirecting...
        </div>
      )}

      {svgError && (
        <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-3 rounded-lg mb-4">
          ⚠️ {svgError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NORMAL MODE FORM */}
        {postMode === 'normal' && (
          <>
            {/* Title */}
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

            {/* Description */}
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

            {/* Image Selection */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-3">Featured Image</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="upload"
                    checked={imageType === 'upload'}
                    onChange={() => {
                      setImageType('upload');
                      setSvgCode('');
                      setSvgError('');
                    }}
                    className="text-[#00d4ff]"
                  />
                  <span className="text-white">Upload Image (JPG/PNG/GIF)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="svg"
                    checked={imageType === 'svg'}
                    onChange={() => {
                      setImageType('svg');
                      setImageFile(null);
                      setSvgError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[#00d4ff]"
                  />
                  <span className="text-white">Use SVG Code</span>
                </label>
              </div>

              {imageType === 'upload' && (
                <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="text-white w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00d4ff] file:text-black hover:file:bg-[#00b8e6] cursor-pointer"
                  />
                  <p className="text-xs text-[#6c86a3] mt-2">Supported: JPG, PNG, GIF, WEBP, SVG (max 5MB)</p>
                </div>
              )}

              {imageType === 'svg' && (
                <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                  <label className="block text-sm text-[#b0bedb] mb-2">SVG Code</label>
                  <textarea
                    placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="100%" height="100%" fill="#00d4ff" rx="8"/>
  <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-weight="bold">VexaTrade</text>
</svg>`}
                    value={svgCode}
                    onChange={handleSvgChange}
                    rows={8}
                    className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
                  />
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      💡 <strong>Note:</strong> Paste only SVG code – not HTML.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#00d4ff]/30">
                <h3 className="text-sm font-medium text-[#b0bedb] mb-3">Image Preview</h3>
                <div className="flex justify-center p-4 bg-[#131724] rounded-lg min-h-[100px]">
                  {imagePreview.startsWith('data:image/svg+xml') ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: svgCode }} 
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                  ) : (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-full max-h-[200px] object-contain rounded"
                      onError={(e) => { 
                        e.target.style.display = 'none'; 
                        e.target.parentElement.innerHTML = '<div class="text-red-400 text-sm">⚠️ Invalid image format</div>';
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">Post Content (Rich Text Editor)</label>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white text-black rounded-lg"
                placeholder="Write your post content here... Use toolbar for formatting, colors, backgrounds, images, videos..."
              />
              <p className="text-xs text-[#6c86a3] mt-2">✅ Supports: Bold, Italic, Colors, Backgrounds, Lists, Links, Images, Videos</p>
            </div>
          </>
        )}

        {/* HTML MODE FORM - Two Separate Code Boxes */}
        {postMode === 'html' && (
          <>
            {/* HTML Mode Title */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">Post Title *</label>
              <input
                type="text"
                placeholder="Enter post title"
                value={htmlTitle}
                onChange={(e) => setHtmlTitle(e.target.value)}
                className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff] text-lg"
                required
              />
            </div>

            {/* HTML Mode Description */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">Short Description (Summary)</label>
              <textarea
                placeholder="Brief summary that appears on the homepage card..."
                value={htmlDescription}
                onChange={(e) => setHtmlDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#0f1422] border border-[#2a3440] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff]"
              />
            </div>

            {/* CODE BOX 1: HTML Content Code */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">
                📝 Code Box 1: HTML Content Code *
              </label>
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#6c86a3]">Write your HTML/CSS code for the post content</span>
                  <button
                    type="button"
                    onClick={() => {
                      const example = `<h1>Welcome to My Post</h1>
<p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
<h2>Features</h2>
<ul>
  <li>Custom HTML/CSS styling</li>
  <li>Embed videos and iframes</li>
  <li>Create interactive content</li>
</ul>
<div style="background: linear-gradient(135deg, #00d4ff, #0033cc); padding: 20px; border-radius: 12px; text-align: center; color: white;">
  <h3>Custom Styled Box</h3>
  <p>You can add any HTML/CSS here!</p>
</div>`;
                      setHtmlContentCode(example);
                    }}
                    className="text-xs text-[#00d4ff] hover:underline"
                  >
                    📋 Insert Example
                  </button>
                </div>
                <textarea
                  placeholder={`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    h1 { color: #00d4ff; }
  </style>
</head>
<body>
  <h1>Your HTML Content Here</h1>
  <p>Write any HTML/CSS code for your post...</p>
</body>
</html>`}
                  value={htmlContentCode}
                  onChange={(e) => setHtmlContentCode(e.target.value)}
                  rows={15}
                  className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
                  required
                />
                <p className="text-xs text-[#6c86a3] mt-2">
                  💡 You can write full HTML/CSS code. It will be displayed as-is on the user website.
                  Supports: custom fonts, animations, responsive design, embedded videos, and more!
                </p>
              </div>
            </div>

            {/* CODE BOX 2: SVG/HTML Image Code - FIXED */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">
                🎨 Code Box 2: SVG Image Code (Optional)
              </label>
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#6c86a3]">
                    <span className="text-yellow-300">⚠️ SVG ONLY</span> – Paste SVG code for the featured image.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const example = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0033cc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="8"/>
  <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="28" font-weight="bold">VexaTrade</text>
  <text x="50%" y="65%" text-anchor="middle" fill="#e0e0e0" font-size="16">Blockchain Ecosystem</text>
</svg>`;
                      setHtmlImageCode(example);
                    }}
                    className="text-xs text-[#00d4ff] hover:underline"
                  >
                    📋 Insert SVG Example
                  </button>
                </div>
                <textarea
                  placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="100%" height="100%" fill="#00d4ff" rx="8"/>
  <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Your SVG Image</text>
</svg>`}
                  value={htmlImageCode}
                  onChange={handleHtmlImageCodeChange}
                  rows={12}
                  className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
                />
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-300">
                    ⚠️ <strong>IMPORTANT:</strong> This field is for <strong>SVG code only</strong> (vector graphics).
                  </p>
                </div>
              </div>
            </div>

            {/* HTML Mode Image Preview */}
            {htmlImagePreview && (
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#00d4ff]/30">
                <h3 className="text-sm font-medium text-[#b0bedb] mb-3">Image Preview</h3>
                <div className="flex justify-center p-4 bg-[#131724] rounded-lg min-h-[100px]">
                  {htmlImagePreview.startsWith('data:image/svg+xml') ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: htmlImageCode }} 
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                  ) : htmlImagePreview.startsWith('data:image') ? (
                    <img 
                      src={htmlImagePreview} 
                      alt="Preview" 
                      className="max-w-full max-h-[200px] object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="text-red-400 text-sm">⚠️ Invalid image format</div>';
                      }}
                    />
                  ) : htmlImagePreview.includes('<img') ? (
                    <div dangerouslySetInnerHTML={{ __html: htmlImageCode }} />
                  ) : (
                    <div className="text-[#6c86a3]">Preview not available for this format</div>
                  )}
                </div>
                {htmlImageCode && (
                  <div className="mt-3 text-xs text-[#6c86a3] border-t border-[#2a3440] pt-3">
                    <details>
                      <summary className="cursor-pointer text-[#00d4ff]">View SVG/HTML Code</summary>
                      <pre className="mt-2 p-2 bg-[#0a0e1a] rounded overflow-x-auto text-[#b0bedb] max-h-[200px]">
                        {htmlImageCode.substring(0, 1000)}{htmlImageCode.length > 1000 ? '...' : ''}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* HTML Content Preview */}
            {htmlContentCode && (
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#00d4ff]/30">
                <h3 className="text-sm font-medium text-[#b0bedb] mb-3">Content Preview</h3>
                <div className="p-4 bg-[#131724] rounded-lg max-h-[400px] overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: htmlContentCode }} />
                </div>
                <p className="text-xs text-[#6c86a3] mt-2">⚠️ This is a visual preview. Actual display may vary on user website.</p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-[#00d4ff] mb-2">💡 HTML Mode Tips:</h4>
              <ul className="text-xs text-[#b0bedb] space-y-1 list-disc list-inside">
                <li>You can use any HTML/CSS code for complete design freedom</li>
                <li>Add custom fonts, animations, and interactive elements</li>
                <li>Embed YouTube videos, iframes, or external content</li>
                <li>Create responsive layouts that work on all devices</li>
                <li>Both code boxes work independently - content box for post body, image box for featured image</li>
              </ul>
            </div>
          </>
        )}

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

      {/* Information Box */}
      <div className="mt-8 p-4 bg-[#0f1422] rounded-lg border border-[#2a3440]">
        <h3 className="text-sm font-semibold text-[#00d4ff] mb-2">📱 Mode Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#b0bedb]">
          <div className="border-r border-[#2a3440] pr-4">
            <strong className="text-white">Normal Mode:</strong>
            <ul className="mt-1 list-disc list-inside">
              <li>WYSIWYG rich text editor</li>
              <li>Upload images from your computer</li>
              <li>Easy formatting like Word</li>
              <li>Best for regular blog posts</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">HTML Code Mode:</strong>
            <ul className="mt-1 list-disc list-inside">
              <li>Complete HTML/CSS control</li>
              <li>Two separate code boxes (Content + Image)</li>
              <li>Create custom SVG graphics</li>
              <li>Best for advanced/custom designs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}