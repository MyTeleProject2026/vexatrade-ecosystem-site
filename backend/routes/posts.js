const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for post images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all posts (public after user login)
router.get('/', verifyUserToken, (req, res) => {
  db.all('SELECT id, title, description, image_url, created_at FROM posts ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// Get single post by id
router.get('/:id', verifyUserToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: row });
  });
});

// Admin: Create post
router.post('/', verifyAdminToken, upload.single('image'), (req, res) => {
  const { title, description, content } = req.body;
  const image_url = req.file ? `/uploads/posts/${req.file.filename}` : null;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  db.run(
    'INSERT INTO posts (title, description, content, image_url) VALUES (?, ?, ?, ?)',
    [title, description || '', content || '', image_url],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Admin: Update post
router.put('/:id', verifyAdminToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, content } = req.body;
  let image_url = req.body.existing_image_url;
  if (req.file) {
    image_url = `/uploads/posts/${req.file.filename}`;
  }
  db.run(
    'UPDATE posts SET title = ?, description = ?, content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, description || '', content || '', image_url, id],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (this.changes === 0) return res.status(404).json({ success: false, message: 'Post not found' });
      res.json({ success: true });
    }
  );
});

// Admin: Delete post
router.delete('/:id', verifyAdminToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true });
  });
});

module.exports = router;