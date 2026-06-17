const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');
const router = express.Router();

// Use memory storage (no local files)
const storage = multer.memoryStorage();

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

// Helpers (same as ebook.js)
const uploadToCloudinary = (buffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vexatrade_ecosystem/${folder}`,
        resource_type: 'auto',
        public_id: publicId || undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  const pathSegments = parts.slice(uploadIndex + 2);
  return pathSegments.join('/').split('.')[0];
};

// SVG validation (same)
const validateAndCleanSvg = (svgCode) => {
  if (!svgCode || typeof svgCode !== 'string') return null;
  const trimmed = svgCode.trim();
  if (!trimmed) return null;
  if (trimmed.includes('<!DOCTYPE') || trimmed.includes('<html') || trimmed.includes('<head')) {
    return { valid: false, error: 'HTML detected – use SVG only for images' };
  }
  if (!trimmed.includes('<svg') || !trimmed.includes('</svg>')) {
    return { valid: false, error: 'Invalid SVG: missing <svg> or </svg>' };
  }
  let cleanSvg = trimmed;
  if (!cleanSvg.includes('xmlns')) {
    cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!cleanSvg.includes('viewBox')) {
    cleanSvg = cleanSvg.replace('<svg', '<svg viewBox="0 0 400 200"');
  }
  return { valid: true, svg: cleanSvg };
};

// GET all posts (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, image_url, content, is_html_mode, created_at FROM posts ORDER BY created_at DESC'
    );
    // Cloudinary URLs are absolute; no need to modify
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single post
router.get('/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE post – upload image to Cloudinary
router.post('/', verifyAdminToken, upload.single('image'), async (req, res) => {
  const { title, description, content, is_html_mode, image_url_data, image_code } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  try {
    let image_url = null;

    // If file uploaded via multer
    if (req.file) {
      image_url = await uploadToCloudinary(req.file.buffer, 'posts', `${Date.now()}-${req.file.originalname}`);
    } else if (image_code && image_code.trim()) {
      const validation = validateAndCleanSvg(image_code);
      if (validation && validation.valid) {
        const buffer = Buffer.from(validation.svg, 'utf8');
        image_url = await uploadToCloudinary(buffer, 'posts', `${Date.now()}-image.svg`);
      } else {
        return res.status(400).json({
          success: false,
          message: validation ? validation.error : 'Invalid SVG code'
        });
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      const base64Data = image_url_data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      image_url = await uploadToCloudinary(buffer, 'posts', `${Date.now()}-image`);
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

// UPDATE post – handle image replacement
router.put('/:id', verifyAdminToken, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, description, content, existing_image_url, is_html_mode, image_url_data, image_code } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let updates = [];
    let values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || '');
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    // Handle image update
    let image_url = existing[0].image_url;

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (existing[0].image_url) {
        const publicId = getPublicIdFromUrl(existing[0].image_url);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old image failed:', e));
        }
      }
      image_url = await uploadToCloudinary(req.file.buffer, 'posts', `${Date.now()}-${req.file.originalname}`);
      updates.push('image_url = ?');
      values.push(image_url);
    } else if (image_code && image_code.trim()) {
      const validation = validateAndCleanSvg(image_code);
      if (validation && validation.valid) {
        if (existing[0].image_url) {
          const publicId = getPublicIdFromUrl(existing[0].image_url);
          if (publicId) {
            await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old image failed:', e));
          }
        }
        const buffer = Buffer.from(validation.svg, 'utf8');
        image_url = await uploadToCloudinary(buffer, 'posts', `${Date.now()}-image.svg`);
        updates.push('image_url = ?');
        values.push(image_url);
      } else {
        return res.status(400).json({
          success: false,
          message: validation ? validation.error : 'Invalid SVG code'
        });
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      if (existing[0].image_url) {
        const publicId = getPublicIdFromUrl(existing[0].image_url);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old image failed:', e));
        }
      }
      const base64Data = image_url_data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      image_url = await uploadToCloudinary(buffer, 'posts', `${Date.now()}-image`);
      updates.push('image_url = ?');
      values.push(image_url);
    }

    const isHtmlMode = is_html_mode === 'true' || is_html_mode === true;
    if (isHtmlMode !== existing[0].is_html_mode) {
      updates.push('is_html_mode = ?');
      values.push(isHtmlMode ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);
    const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    res.json({
      success: true,
      message: 'Post updated successfully'
    });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE post – remove image from Cloudinary
router.delete('/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT image_url FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (rows[0].image_url) {
      const publicId = getPublicIdFromUrl(rows[0].image_url);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(e => console.warn('Delete image failed:', e));
      }
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;