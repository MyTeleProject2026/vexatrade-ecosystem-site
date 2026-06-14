const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, 'uploads/posts/');
    } else {
      cb(null, 'uploads/ebooks/');
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for ebooks
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
    
    const filePath = path.join(__dirname, '..', rows[0].file_url);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    
    // Set appropriate content type
    const fileType = rows[0].file_type || 'pdf';
    let contentType = 'application/pdf';
    if (fileType === 'html' || rows[0].file_url.endsWith('.html')) {
      contentType = 'text/html';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(rows[0].title)}.${fileType === 'html' ? 'html' : 'pdf'}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create ebook (admin)
router.post('/', verifyAdminToken, upload.fields([{ name: 'cover' }, { name: 'file' }]), async (req, res) => {
  const { title, description, file_type, html_content } = req.body;
  const cover_url = req.files?.cover ? `/uploads/posts/${req.files.cover[0].filename}` : null;
  let file_url = null;
  let finalFileType = file_type || 'pdf';
  
  if (req.files?.file) {
    file_url = `/uploads/ebooks/${req.files.file[0].filename}`;
    // Determine file type from extension if not provided
    if (!file_type && req.files.file[0].originalname.endsWith('.html')) {
      finalFileType = 'html';
    }
  }
  
  if (!title || !file_url) {
    return res.status(400).json({ success: false, message: 'Title and file are required' });
  }
  
  try {
    // Check if table has file_type column, if not add it
    try {
      await pool.query('ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT "pdf"');
    } catch (alterErr) {
      // Column might already exist
    }
    
    const [result] = await pool.query(
      'INSERT INTO ebooks (title, description, cover_image_url, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', cover_url, file_url, finalFileType]
    );
    res.json({ success: true, id: result.insertId });
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
    
    // Delete file from disk
    const filePath = path.join(__dirname, '..', rows[0].file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await pool.query('DELETE FROM ebooks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// View HTML ebook (direct view, not download)
router.get('/view/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT file_url, file_type FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ebook not found' });
    
    const filePath = path.join(__dirname, '..', rows[0].file_url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const fileType = rows[0].file_type || '';
    
    if (fileType === 'html' || filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // For PDF, redirect to download
      res.redirect(`/api/ebooks/download/${id}`);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;