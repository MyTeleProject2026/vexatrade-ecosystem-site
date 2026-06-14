const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for ebooks (PDF) and covers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, 'uploads/posts/'); // reuse posts folder for covers
    } else {
      cb(null, 'uploads/ebooks/');
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all ebooks (public after user login)
router.get('/', verifyUserToken, (req, res) => {
  db.all('SELECT id, title, description, cover_image_url, file_url, created_at FROM ebooks ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// Get single ebook by id
router.get('/:id', verifyUserToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM ebooks WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Ebook not found' });
    res.json({ success: true, data: row });
  });
});

// Download ebook file
router.get('/download/:id', verifyUserToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT file_url FROM ebooks WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Ebook not found' });
    const filePath = path.join(__dirname, '..', row.file_url);
    res.download(filePath);
  });
});

// Admin: Create ebook
router.post('/', verifyAdminToken, upload.fields([{ name: 'cover' }, { name: 'file' }]), (req, res) => {
  const { title, description } = req.body;
  const cover_url = req.files?.cover ? `/uploads/posts/${req.files.cover[0].filename}` : null;
  const file_url = req.files?.file ? `/uploads/ebooks/${req.files.file[0].filename}` : null;
  if (!title || !file_url) {
    return res.status(400).json({ success: false, message: 'Title and PDF file required' });
  }
  db.run(
    'INSERT INTO ebooks (title, description, cover_image_url, file_url) VALUES (?, ?, ?, ?)',
    [title, description || '', cover_url, file_url],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Admin: Delete ebook
router.delete('/:id', verifyAdminToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT file_url FROM ebooks WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Ebook not found' });
    // Optionally delete file from disk, but skip for simplicity
    db.run('DELETE FROM ebooks WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    });
  });
});

module.exports = router;