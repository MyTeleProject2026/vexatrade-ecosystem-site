const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token from header or query param
const verifyTokenQuery = (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).send('No token provided');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/';
    if (file.fieldname === 'cover') {
      dir = 'uploads/posts/';
    } else if (file.fieldname === 'file') {
      dir = 'uploads/ebooks/';
    }
    // Ensure directory exists
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Keep original extension
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Get all ebooks (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, cover_image_url, file_url, file_type, created_at FROM ebooks ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single ebook
router.get('/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ebook not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download ebook file
router.get('/download/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT file_url, file_type, title FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ebook not found' });
    
    // Get absolute path
    const fileUrl = rows[0].file_url;
    let filePath;
    
    if (fileUrl.startsWith('/uploads/')) {
      filePath = path.join(__dirname, '..', fileUrl);
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(fileUrl));
    }
    
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    
    const fileType = rows[0].file_type || 'pdf';
    let contentType = 'application/pdf';
    let fileExt = 'pdf';
    
    if (fileType === 'html' || fileUrl.endsWith('.html')) {
      contentType = 'text/html';
      fileExt = 'html';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(rows[0].title)}.${fileExt}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// View HTML ebook
router.get('/view/:id', verifyTokenQuery, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT file_url, file_type, title FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Ebook not found');
    
    // Get absolute path
    const fileUrl = rows[0].file_url;
    let filePath;
    
    if (fileUrl.startsWith('/uploads/')) {
      filePath = path.join(__dirname, '..', fileUrl);
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(fileUrl));
    }
    
    console.log('Viewing file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).send('File not found on server. Please re-upload the ebook.');
    }
    
    let htmlContent = fs.readFileSync(filePath, 'utf8');
    
    // Wrap with VexaTrade theme if needed
    if (!htmlContent.includes('<style') || !htmlContent.includes('</head>')) {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${rows[0].title || 'VexaTrade Ebook'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #07111e 100%);
      color: #b0bedb;
      line-height: 1.7;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .ebook-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 50px;
      background: rgba(19, 23, 36, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 28px;
      border: 1px solid rgba(0, 212, 255, 0.25);
      box-shadow: 0 25px 45px -12px rgba(0,0,0,0.5);
    }
    h1 { font-size: 2.5rem; color: #00d4ff; margin-bottom: 1.5rem; border-left: 4px solid #00d4ff; padding-left: 20px; }
    h2 { color: #38bdf8; margin-top: 2rem; margin-bottom: 1rem; }
    h3 { color: #7dd3fc; margin-top: 1.5rem; }
    p { margin-bottom: 1rem; }
    a { color: #00d4ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #1e293b; padding: 2px 8px; border-radius: 8px; font-family: monospace; }
    pre { background: #0f1422; padding: 15px; border-radius: 12px; overflow-x: auto; border: 1px solid #2a3440; }
    img { max-width: 100%; border-radius: 12px; }
    .tip, .note, .warning { background: #0f1422; border-left: 4px solid #00d4ff; padding: 15px 20px; margin: 20px 0; border-radius: 12px; }
    .warning { border-left-color: #f59e0b; }
    hr { border: none; height: 1px; background: linear-gradient(to right, #00d4ff, transparent); margin: 30px 0; }
    @media (max-width: 768px) {
      .ebook-container { padding: 25px; }
      h1 { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
<div class="ebook-container">
${htmlContent}
</div>
</body>
</html>`;
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (err) {
    console.error('View ebook error:', err);
    res.status(500).send('Error loading ebook: ' + err.message);
  }
});

// Create ebook (admin)
router.post('/', verifyAdminToken, upload.fields([{ name: 'cover' }, { name: 'file' }]), async (req, res) => {
  const { title, description, file_type } = req.body;
  const cover_url = req.files?.cover ? `/uploads/posts/${req.files.cover[0].filename}` : null;
  let file_url = null;
  let finalFileType = file_type || 'pdf';
  
  if (req.files?.file) {
    const file = req.files.file[0];
    file_url = `/uploads/ebooks/${file.filename}`;
    if (file.originalname.endsWith('.html')) {
      finalFileType = 'html';
    }
  }
  
  if (!title || !file_url) {
    return res.status(400).json({ success: false, message: 'Title and file are required' });
  }
  
  try {
    await pool.query('ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT "pdf"');
    
    const [result] = await pool.query(
      'INSERT INTO ebooks (title, description, cover_image_url, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', cover_url, file_url, finalFileType]
    );
    res.json({ success: true, id: result.insertId, file_url: file_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete ebook (admin)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT file_url FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ebook not found' });
    
    const fileUrl = rows[0].file_url;
    let filePath;
    if (fileUrl.startsWith('/uploads/')) {
      filePath = path.join(__dirname, '..', fileUrl);
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(fileUrl));
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await pool.query('DELETE FROM ebooks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;