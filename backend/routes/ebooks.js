const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') cb(null, 'uploads/posts/');
    else cb(null, 'uploads/ebooks/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all ebooks (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, description, cover_image_url, file_url, created_at FROM ebooks ORDER BY created_at DESC');
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
    const [rows] = await pool.query('SELECT file_url FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ebook not found' });
    const filePath = path.join(__dirname, '..', rows[0].file_url);
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create ebook (admin)
router.post('/', verifyAdminToken, upload.fields([{ name: 'cover' }, { name: 'file' }]), async (req, res) => {
  const { title, description } = req.body;
  const cover_url = req.files?.cover ? `/uploads/posts/${req.files.cover[0].filename}` : null;
  const file_url = req.files?.file ? `/uploads/ebooks/${req.files.file[0].filename}` : null;
  if (!title || !file_url) {
    return res.status(400).json({ success: false, message: 'Title and PDF file required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO ebooks (title, description, cover_image_url, file_url) VALUES (?, ?, ?, ?)',
      [title, description || '', cover_url, file_url]
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
    // Optional: delete file from disk, but skip for simplicity
    await pool.query('DELETE FROM ebooks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;