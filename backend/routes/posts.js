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
    const uploadDir = path.join(__dirname, '../../uploads/posts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.svg')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, WEBP, and SVG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Helper: Validate and clean SVG
const validateAndCleanSvg = (svgCode) => {
  if (!svgCode || !svgCode.trim()) return null;
  
  let cleanSvg = svgCode.trim();
  
  if (!cleanSvg.includes('xmlns')) {
    cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  if (!cleanSvg.includes('viewBox')) {
    cleanSvg = cleanSvg.replace('<svg', '<svg viewBox="0 0 400 200"');
  }
  
  if (!cleanSvg.includes('</svg>')) {
    return null;
  }
  
  return cleanSvg;
};

// Get all posts (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, image_url, content, is_html_mode, created_at FROM posts ORDER BY created_at DESC'
    );
    
    const baseUrl = process.env.BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
    const posts = rows.map(post => ({
      ...post,
      image_url: post.image_url ? `${baseUrl}${post.image_url}` : null
    }));
    
    res.json({ success: true, data: posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single post (user + admin)
router.get('/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const baseUrl = process.env.BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
    const post = {
      ...rows[0],
      image_url: rows[0].image_url ? `${baseUrl}${rows[0].image_url}` : null
    };
    
    res.json({ success: true, data: post });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create post (admin)
router.post('/', verifyAdminToken, upload.single('image'), async (req, res) => {
  const { title, description, content, is_html_mode, image_url_data, image_code } = req.body;
  
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  
  try {
    let image_url = null;
    
    if (req.file) {
      image_url = `/uploads/posts/${req.file.filename}`;
    } else if (image_code && image_code.trim()) {
      let cleanSvg = validateAndCleanSvg(image_code);
      if (cleanSvg) {
        const svgFileName = `post-${Date.now()}.svg`;
        const svgPath = path.join(__dirname, '../../uploads/posts/', svgFileName);
        fs.writeFileSync(svgPath, cleanSvg, 'utf8');
        image_url = `/uploads/posts/${svgFileName}`;
      } else {
        image_url = image_code;
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      image_url = image_url_data;
    }
    
    const isHtmlMode = is_html_mode === 'true' || is_html_mode === true;
    
    const [result] = await pool.query(
      'INSERT INTO posts (title, description, content, image_url, is_html_mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [title, description || '', content || '', image_url, isHtmlMode]
    );
    
    res.json({
      success: true,
      id: result.insertId,
      message: 'Post created successfully'
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update post (admin)
router.put('/:id', verifyAdminToken, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, description, content, existing_image_url, is_html_mode, image_url_data, image_code } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    let image_url = existing_image_url || existing[0].image_url;
    
    if (req.file) {
      if (existing[0].image_url && !existing[0].image_url.startsWith('data:') && !existing[0].image_url.includes('data:')) {
        const oldImagePath = path.join(__dirname, '../..', existing[0].image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_url = `/uploads/posts/${req.file.filename}`;
    } else if (image_code && image_code.trim()) {
      if (existing[0].image_url && !existing[0].image_url.startsWith('data:') && !existing[0].image_url.includes('data:')) {
        const oldImagePath = path.join(__dirname, '../..', existing[0].image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      let cleanSvg = validateAndCleanSvg(image_code);
      if (cleanSvg) {
        const svgFileName = `post-${Date.now()}.svg`;
        const svgPath = path.join(__dirname, '../../uploads/posts/', svgFileName);
        fs.writeFileSync(svgPath, cleanSvg, 'utf8');
        image_url = `/uploads/posts/${svgFileName}`;
      } else {
        image_url = image_code;
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      image_url = image_url_data;
    }
    
    const isHtmlMode = is_html_mode === 'true' || is_html_mode === true;
    
    const [result] = await pool.query(
      `UPDATE posts 
       SET title = ?, description = ?, content = ?, image_url = ?, is_html_mode = ?, updated_at = NOW() 
       WHERE id = ?`,
      [title, description || '', content || '', image_url, isHtmlMode, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    res.json({
      success: true,
      message: 'Post updated successfully'
    });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete post (admin)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query('SELECT image_url FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    if (rows[0].image_url && !rows[0].image_url.startsWith('data:') && !rows[0].image_url.includes('data:')) {
      const imagePath = path.join(__dirname, '../..', rows[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;