import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEbook, createEbook, updateEbook } from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function EbookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Ebook creation mode: 'normal' or 'html'
  const [ebookMode, setEbookMode] = useState('normal'); // 'normal' or 'html'
  
  // Normal mode fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageType, setImageType] = useState('upload'); // 'upload' or 'svg'
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [svgCode, setSvgCode] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [existingPdf, setExistingPdf] = useState('');
  
  // HTML mode fields
  const [htmlTitle, setHtmlTitle] = useState('');
  const [htmlDescription, setHtmlDescription] = useState('');
  const [htmlContentCode, setHtmlContentCode] = useState('');
  const [htmlImageCode, setHtmlImageCode] = useState('');
  const [htmlImagePreview, setHtmlImagePreview] = useState('');
  const [svgError, setSvgError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

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
      return { valid: false, error: '⚠️ HTML content detected – please use SVG only for images, not full HTML' };
    }

    // Must have <svg> and </svg>
    if (!trimmed.includes('<svg')) {
      return { valid: false, error: 'Missing <svg> tag' };
    }
    if (!trimmed.includes('</svg>')) {
      return { valid: false, error: 'Missing closing </svg> tag' };
    }

    // Should have xmlns attribute
    if (!trimmed.includes('xmlns')) {
      return { valid: false, error: 'Missing xmlns attribute (add xmlns="http://www.w3.org/2000/svg")' };
    }

    // Parse with DOMParser (client-side)
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

  // Load existing ebook for editing
  useEffect(() => {
    if (id) {
      getEbook(id).then(res => {
        const ebook = res.data.data;
        
        // Detect if this is an HTML mode ebook
        if (ebook.is_html_mode || (ebook.content && ebook.content.includes('<!DOCTYPE') || ebook.content.includes('<html'))) {
          setEbookMode('html');
          setHtmlTitle(ebook.title);
          setHtmlDescription(ebook.description || '');
          setHtmlContentCode(ebook.content || '');
          setHtmlImageCode(ebook.image_url || '');
          setHtmlImagePreview(ebook.image_url || '');
        } else {
          setEbookMode('normal');
          setTitle(ebook.title);
          setDescription(ebook.description || '');
          setContent(ebook.content || '');
          setExistingImage(ebook.image_url || '');
          setImagePreview(ebook.image_url || '');
          setExistingPdf(ebook.file_url || '');
          
          if (ebook.image_url && ebook.image_url.startsWith('data:image/svg+xml')) {
            setImageType('svg');
            setSvgCode(decodeURIComponent(ebook.image_url.split(',')[1] || ''));
          }
        }
      }).catch(err => {
        setError('Failed to load ebook');
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

  // Handle normal mode PDF file upload
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfFile(file);
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
        // Properly encode SVG for data URI
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
    setPdfFile(null);
    setSvgError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
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
      if (ebookMode === 'normal') {
        // NORMAL MODE SUBMISSION
        if (!title.trim()) {
          setError('Title is required');
          setLoading(false);
          return;
        }

        if (!pdfFile && !id) {
          setError('Please select a PDF file');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content', content);
        formData.append('file_type', 'pdf');
        formData.append('is_html_mode', 'false');

        if (imageType === 'upload' && imageFile) {
          formData.append('cover', imageFile);
        } else if (imageType === 'svg' && svgCode.trim()) {
          // Validate SVG before sending
          const validation = validateSvg(svgCode);
          if (!validation.valid) {
            setError('Invalid SVG: ' + validation.error);
            setLoading(false);
            return;
          }
          
          // Clean SVG code
          let cleanSvg = svgCode.trim();
          if (!cleanSvg.includes('xmlns')) {
            cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          
          const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml' });
          const svgFile = new File([svgBlob], 'cover.svg', { type: 'image/svg+xml' });
          formData.append('cover', svgFile);
        }

        if (pdfFile) {
          formData.append('file', pdfFile);
        }

        if (id) {
          await updateEbook(id, formData);
          setSuccess('Ebook updated successfully!');
        } else {
          await createEbook(formData);
          setSuccess('Ebook created successfully!');
          resetNormalMode();
        }
      } 
      else if (ebookMode === 'html') {
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
        formData.append('file_type', 'html');
        formData.append('is_html_mode', 'true');
        
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
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #ffffff; }
    a { color: #00d4ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre, code { background-color: #1e293b; padding: 2px 6px; border-radius: 4px; }
    .chapter { border-bottom: 1px solid #2a3440; padding-bottom: 20px; margin-bottom: 20px; }
    .toc { background: #0f1422; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
    .toc a { display: block; padding: 8px 0; color: #b0bedb; }
    .toc a:hover { color: #00d4ff; }
  </style>
</head>
<body>
  ${htmlContentCode}
</body>
</html>`;
        }
        
        formData.append('content', fullHtmlContent);
        
        // Create HTML file from content
        const htmlBlob = new Blob([fullHtmlContent], { type: 'text/html' });
        const htmlFile = new File([htmlBlob], `${htmlTitle.replace(/[^a-z0-9]/gi, '_')}.html`, { type: 'text/html' });
        formData.append('file', htmlFile);
        
        // Handle HTML image code for cover
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
            const svgFile = new File([svgBlob], 'cover.svg', { type: 'image/svg+xml' });
            formData.append('cover', svgFile);
          } else if (htmlImageCode.startsWith('data:image')) {
            formData.append('image_url_data', htmlImageCode);
          } else {
            formData.append('image_code', htmlImageCode);
          }
        }

        if (id) {
          await updateEbook(id, formData);
          setSuccess('HTML ebook updated successfully!');
        } else {
          await createEbook(formData);
          setSuccess('HTML ebook created successfully!');
          resetHtmlMode();
        }
      }

      // Redirect after 2 seconds on success
      setTimeout(() => {
        navigate('/ebooks');
      }, 2000);
      
    } catch (err) {
      setError('Failed to save ebook: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">{id ? 'Edit Ebook' : 'Create New Ebook'}</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setEbookMode('normal');
              resetHtmlMode();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              ebookMode === 'normal' 
                ? 'bg-[#00d4ff] text-black' 
                : 'bg-[#0f1422] text-[#b0bedb] border border-[#2a3440] hover:border-[#00d4ff]'
            }`}
          >
            📝 Normal Mode (PDF)
          </button>
          <button
            type="button"
            onClick={() => {
              setEbookMode('html');
              resetNormalMode();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              ebookMode === 'html' 
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
        {ebookMode === 'normal' && (
          <>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">Ebook Title *</label>
              <input
                type="text"
                placeholder="Enter ebook title"
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

            {/* Cover Image Selection */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-3">Cover Image</label>
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
                      Example: <code className="text-[#00d4ff]">&lt;svg xmlns="..." viewBox="..."&gt;...&lt;/svg&gt;</code>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Preview - FIXED */}
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

            {/* PDF File Upload */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">PDF File *</label>
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="text-white w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00d4ff] file:text-black hover:file:bg-[#00b8e6] cursor-pointer"
                />
                <p className="text-xs text-[#6c86a3] mt-2">Select a PDF file for users to download</p>
                {existingPdf && !pdfFile && (
                  <p className="text-xs text-[#00d4ff] mt-2">📄 Current PDF: {existingPdf.split('/').pop()}</p>
                )}
              </div>
            </div>

            {/* Rich Text Editor for Ebook Description/Content */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">Ebook Content (Rich Text Editor)</label>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white text-black rounded-lg"
                placeholder="Write your ebook content here... This will be displayed on the ebook detail page."
              />
              <p className="text-xs text-[#6c86a3] mt-2">✅ Supports: Bold, Italic, Colors, Backgrounds, Lists, Links, Images, Videos</p>
            </div>
          </>
        )}

        {/* HTML MODE FORM - Two Separate Code Boxes */}
        {ebookMode === 'html' && (
          <>
            {/* HTML Mode Title */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">Ebook Title *</label>
              <input
                type="text"
                placeholder="Enter ebook title"
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
                📝 Code Box 1: HTML Ebook Content *
              </label>
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#6c86a3]">Write your HTML/CSS code for the ebook content</span>
                  <button
                    type="button"
                    onClick={() => {
                      const example = `<h1>Your Ebook Title</h1>

<div class="toc">
  <h2>Table of Contents</h2>
  <a href="#chapter1">Chapter 1: Introduction</a>
  <a href="#chapter2">Chapter 2: Getting Started</a>
  <a href="#chapter3">Chapter 3: Advanced Topics</a>
</div>

<div class="chapter" id="chapter1">
  <h2>Chapter 1: Introduction</h2>
  <p>Welcome to this comprehensive guide. This chapter covers the fundamentals.</p>
  <ul>
    <li>Understanding the basics</li>
    <li>Key concepts explained</li>
    <li>Getting prepared</li>
  </ul>
  <div style="background: #0f1422; padding: 15px; border-radius: 8px; border-left: 4px solid #00d4ff; margin: 15px 0;">
    <strong>💡 Key Takeaway:</strong> This is the most important concept to understand.
  </div>
</div>

<div class="chapter" id="chapter2">
  <h2>Chapter 2: Getting Started</h2>
  <p>Now that you understand the basics, let's dive into practical steps.</p>
  <ol>
    <li>Step 1: Set up your environment</li>
    <li>Step 2: Configure your settings</li>
    <li>Step 3: Start your journey</li>
  </ol>
</div>

<div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #0f1422, #1a2332); border-radius: 12px; margin-top: 30px;">
  <h3 style="color: #00d4ff;">🎉 Thank You for Reading!</h3>
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
    body { font-family: Arial; padding: 20px; background: #0b0f1c; color: #b0bedb; }
    h1 { color: #00d4ff; }
    .chapter { margin-bottom: 30px; border-bottom: 1px solid #2a3440; padding-bottom: 20px; }
    .toc { background: #0f1422; padding: 20px; border-radius: 12px; }
  </style>
</head>
<body>
  <h1>Your Ebook Content Here</h1>
  <p>Write your ebook HTML/CSS code...</p>
</body>
</html>`}
                  value={htmlContentCode}
                  onChange={(e) => setHtmlContentCode(e.target.value)}
                  rows={15}
                  className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
                  required
                />
                <p className="text-xs text-[#6c86a3] mt-2">
                  💡 You can write full HTML/CSS code. It will be displayed as a complete ebook with chapters.
                </p>
              </div>
            </div>

            {/* CODE BOX 2: SVG/HTML Image Code for Cover - FIXED */}
            <div>
              <label className="block text-sm font-medium text-[#b0bedb] mb-2">
                🎨 Code Box 2: SVG Cover Image Code (Optional)
              </label>
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#2a3440]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#6c86a3]">
                    <span className="text-yellow-300">⚠️ SVG ONLY</span> – Paste SVG code for the cover image.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const example = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0033cc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="12"/>
  <circle cx="50" cy="50" r="80" fill="#ffffff" opacity="0.05"/>
  <circle cx="350" cy="200" r="60" fill="#ffffff" opacity="0.05"/>
  <text x="50%" y="40%" text-anchor="middle" fill="white" font-size="32" font-weight="bold">VexaTrade</text>
  <text x="50%" y="55%" text-anchor="middle" fill="#e0e0e0" font-size="18">Blockchain Ecosystem</text>
  <rect x="30%" y="65%" width="40%" height="3" rx="2" fill="white" opacity="0.3"/>
  <text x="50%" y="78%" text-anchor="middle" fill="#b0bedb" font-size="12">📖 Educational Guide</text>
</svg>`;
                      setHtmlImageCode(example);
                    }}
                    className="text-xs text-[#00d4ff] hover:underline"
                  >
                    📋 Insert SVG Example
                  </button>
                </div>
                <textarea
                  placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <rect width="100%" height="100%" fill="#00d4ff" rx="8"/>
  <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Your Ebook Cover</text>
</svg>`}
                  value={htmlImageCode}
                  onChange={handleHtmlImageCodeChange}
                  rows={12}
                  className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
                />
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-300">
                    ⚠️ <strong>IMPORTANT:</strong> This field is for <strong>SVG code only</strong> (vector graphics). 
                    For HTML ebook content, use <strong>Code Box 1</strong> above.
                  </p>
                </div>
              </div>
            </div>

            {/* HTML Mode Image Preview - FIXED */}
            {htmlImagePreview && (
              <div className="bg-[#0f1422] p-4 rounded-lg border border-[#00d4ff]/30">
                <h3 className="text-sm font-medium text-[#b0bedb] mb-3">Cover Image Preview</h3>
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
                <h3 className="text-sm font-medium text-[#b0bedb] mb-3">Ebook Content Preview</h3>
                <div className="p-4 bg-[#131724] rounded-lg max-h-[400px] overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: htmlContentCode }} />
                </div>
                <p className="text-xs text-[#6c86a3] mt-2">⚠️ This is a visual preview. Users will see the full ebook when viewed online.</p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-[#00d4ff] mb-2">💡 HTML Ebook Tips:</h4>
              <ul className="text-xs text-[#b0bedb] space-y-1 list-disc list-inside">
                <li>Create complete books with chapters, table of contents, and navigation</li>
                <li>Add custom fonts, animations, and interactive elements</li>
                <li>Embed YouTube videos, iframes, or external content</li>
                <li>Create responsive layouts that work on all devices</li>
                <li>Both code boxes work independently - content box for ebook body, image box for cover</li>
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
            {loading ? 'Saving...' : (id ? 'Update Ebook' : 'Publish Ebook')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/ebooks')}
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
            <strong className="text-white">Normal Mode (PDF):</strong>
            <ul className="mt-1 list-disc list-inside">
              <li>Upload PDF files for download</li>
              <li>Rich text editor for description</li>
              <li>Upload cover images or use SVG</li>
              <li>Best for downloadable PDF guides</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">HTML Code Mode:</strong>
            <ul className="mt-1 list-disc list-inside">
              <li>Complete HTML/CSS control</li>
              <li>Two separate code boxes (Content + Cover)</li>
              <li>Create interactive, multi-chapter ebooks</li>
              <li>Best for online-readable guides</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}