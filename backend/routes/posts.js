const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/posts/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all posts (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, description, image_url, created_at FROM posts ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single post (user + admin)
router.get('/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create post (admin)
router.post('/', verifyAdminToken, upload.single('image'), async (req, res) => {
  const { title, description, content } = req.body;
  const image_url = req.file ? `/uploads/posts/${req.file.filename}` : null;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (title, description, content, image_url) VALUES (?, ?, ?, ?)',
      [title, description || '', content || '', image_url]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update post (admin)
router.put('/:id', verifyAdminToken, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, description, content, existing_image_url } = req.body;
  let image_url = existing_image_url;
  if (req.file) image_url = `/uploads/posts/${req.file.filename}`;
  try {
    const [result] = await pool.query(
      'UPDATE posts SET title = ?, description = ?, content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description || '', content || '', image_url, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete post (admin)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;