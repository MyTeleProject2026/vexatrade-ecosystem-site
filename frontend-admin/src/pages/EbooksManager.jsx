import { useEffect, useState } from 'react';
import { getEbooks, deleteEbook, createEbook } from '../api';

export default function EbooksManager() {
  const [ebooks, setEbooks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ebookType, setEbookType] = useState('pdf'); // 'pdf' or 'html'
  const [cover, setCover] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const loadEbooks = async () => {
    try {
      const res = await getEbooks();
      setEbooks(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadEbooks(); }, []);

  // Generate HTML preview
  useEffect(() => {
    if (ebookType === 'html' && htmlCode) {
      setHtmlPreview(htmlCode);
    } else {
      setHtmlPreview('');
    }
  }, [htmlCode, ebookType]);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!title) {
      setError('Title is required');
      return;
    }
    
    if (ebookType === 'pdf' && !pdfFile) {
      setError('Please select a PDF file');
      return;
    }
    
    if (ebookType === 'html' && !htmlCode.trim()) {
      setError('Please enter HTML code');
      return;
    }
    
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (cover) formData.append('cover', cover);
    
    if (ebookType === 'pdf' && pdfFile) {
      formData.append('file', pdfFile);
      formData.append('file_type', 'pdf');
    } else if (ebookType === 'html') {
      // Create an HTML file from the code
      const htmlBlob = new Blob([htmlCode], { type: 'text/html' });
      const htmlFile = new File([htmlBlob], `${title.replace(/[^a-z0-9]/gi, '_')}.html`, { type: 'text/html' });
      formData.append('file', htmlFile);
      formData.append('file_type', 'html');
      formData.append('html_content', htmlCode);
    }
    
    try {
      await createEbook(formData);
      setTitle('');
      setDescription('');
      setCover(null);
      setPdfFile(null);
      setHtmlCode('');
      setHtmlPreview('');
      setEbookType('pdf');
      loadEbooks();
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ebook permanently?')) return;
    try {
      await deleteEbook(id);
      loadEbooks();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return '📄';
    if (fileUrl.endsWith('.pdf')) return '📕';
    if (fileUrl.endsWith('.html')) return '📘';
    return '📖';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Manage Ebooks & Guides</h1>
      
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="bg-[#0f1422] p-5 rounded-xl mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">Upload New Ebook / Guide</h2>
        {error && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{error}</div>}
        
        {/* Title */}
        <input
          type="text"
          placeholder="Ebook Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00d4ff]"
          required
        />
        
        {/* Description */}
        <textarea
          placeholder="Description (what this ebook/guide is about)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[#131724] border border-[#2a3440] rounded-lg px-4 py-2 text-white"
        />
        
        {/* Ebook Type Selection */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="pdf"
              checked={ebookType === 'pdf'}
              onChange={() => setEbookType('pdf')}
              className="text-[#00d4ff]"
            />
            <span className="text-white">📕 Upload PDF File</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="html"
              checked={ebookType === 'html'}
              onChange={() => setEbookType('html')}
              className="text-[#00d4ff]"
            />
            <span className="text-white">📘 Paste HTML Code</span>
          </label>
        </div>
        
        {/* Cover Image Upload (both options) */}
        <div>
          <label className="block text-sm text-[#b0bedb] mb-1">Cover Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files[0])}
            className="text-white w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00d4ff] file:text-black hover:file:bg-[#00b8e6] cursor-pointer"
          />
          <p className="text-xs text-[#6c86a3] mt-1">Will be displayed on the ebook card (JPG, PNG, GIF, WEBP)</p>
        </div>
        
        {/* PDF File Upload */}
        {ebookType === 'pdf' && (
          <div className="bg-[#131724] p-3 rounded-lg border border-[#2a3440]">
            <label className="block text-sm text-[#b0bedb] mb-2">PDF File *</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="text-white w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00d4ff] file:text-black hover:file:bg-[#00b8e6] cursor-pointer"
              required={ebookType === 'pdf'}
            />
          </div>
        )}
        
        {/* HTML Code Editor */}
        {ebookType === 'html' && (
          <div className="space-y-3">
            <div className="bg-[#131724] p-3 rounded-lg border border-[#2a3440]">
              <label className="block text-sm text-[#b0bedb] mb-2">HTML Code *</label>
              <textarea
                placeholder={`<!DOCTYPE html>
<html>
<head>
  <title>Your Ebook Title</title>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #0b0f1c;
      color: #b0bedb;
    }
    h1 { color: #00d4ff; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <h1>Your Ebook Content</h1>
  <p>Write your ebook content here...</p>
</body>
</html>`}
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                rows={12}
                className="w-full bg-[#0a0e1a] border border-[#2a3440] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00d4ff]"
                required={ebookType === 'html'}
              />
              <p className="text-xs text-[#6c86a3] mt-2">
                💡 Paste complete HTML code for your ebook. Users will be able to view it in their browser.
              </p>
            </div>
            
            {/* Preview Toggle Button */}
            {htmlCode && (
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-sm text-[#00d4ff] hover:underline"
              >
                {previewMode ? 'Hide Preview' : 'Show Live Preview'}
              </button>
            )}
            
            {/* HTML Live Preview */}
            {previewMode && htmlCode && (
              <div className="bg-[#0a0e1a] p-4 rounded-lg border border-[#00d4ff]">
                <h3 className="text-sm font-semibold text-white mb-3">Live Preview</h3>
                <div className="border border-[#2a3440] rounded-lg p-4 max-h-[500px] overflow-auto bg-white">
                  <iframe
                    srcDoc={htmlCode}
                    title="HTML Preview"
                    className="w-full min-h-[400px] border-0"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
                <p className="text-xs text-[#6c86a3] mt-2">
                  ⚠️ This is a preview. Users will see the full ebook when downloaded.
                </p>
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00d4ff] text-black px-5 py-2 rounded-full hover:bg-[#00b8e6] disabled:opacity-50 transition"
        >
          {loading ? 'Uploading...' : 'Upload Ebook'}
        </button>
      </form>
      
      {/* Existing Ebooks List */}
      <h2 className="text-xl font-semibold text-white mb-4">Existing Ebooks & Guides</h2>
      {ebooks.length === 0 ? (
        <p className="text-[#b0bedb]">No ebooks uploaded yet. Create your first ebook above.</p>
      ) : (
        <div className="space-y-3">
          {ebooks.map((ebook) => (
            <div key={ebook.id} className="bg-[#0f1422] p-4 rounded-xl flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {ebook.cover_image_url ? (
                  <img src={ebook.cover_image_url} alt={ebook.title} className="w-12 h-12 rounded object-cover" />
                ) : (
                  <span className="text-2xl">{getFileIcon(ebook.file_url)}</span>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{ebook.title}</h3>
                  <p className="text-sm text-[#b0bedb]">{ebook.description?.slice(0, 100)}</p>
                  <p className="text-xs text-[#6c86a3] mt-1">
                    {ebook.file_url?.endsWith('.pdf') ? '📕 PDF Document' : ebook.file_url?.endsWith('.html') ? '📘 HTML Ebook' : '📄 Document'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={ebook.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00d4ff] hover:underline text-sm"
                >
                  View
                </a>
                <a
                  href={ebook.file_url}
                  download
                  className="text-[#00d4ff] hover:underline text-sm"
                >
                  Download
                </a>
                <button onClick={() => handleDelete(ebook.id)} className="text-red-400 hover:underline text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Help Section */}
      <div className="mt-8 p-4 bg-[#0f1422] rounded-lg border border-[#2a3440]">
        <h3 className="text-sm font-semibold text-[#00d4ff] mb-2">📖 Creating HTML Ebooks</h3>
        <p className="text-xs text-[#b0bedb] mb-2">
          You can create beautiful HTML ebooks with custom styling. Here's a template to get started:
        </p>
        <pre className="bg-[#0a0e1a] p-3 rounded text-xs text-[#b0bedb] overflow-x-auto">{`<!DOCTYPE html>
<html>
<head>
  <title>VexaTrade Guide</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #0b0f1c;
      color: #b0bedb;
      line-height: 1.6;
    }
    h1, h2, h3 { color: #00d4ff; }
    code { background: #1e293b; padding: 2px 6px; border-radius: 6px; }
    pre { background: #1e293b; padding: 15px; border-radius: 12px; overflow-x: auto; }
    .tip { background: #0f1422; border-left: 4px solid #00d4ff; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Your Ebook Title</h1>
  <p>Your content here...</p>
</body>
</html>`}</pre>
      </div>
    </div>
  );
}