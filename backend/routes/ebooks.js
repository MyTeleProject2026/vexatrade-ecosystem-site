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
  const allowedTypes = ['application/pdf', 'text/html', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.html') || file.originalname.endsWith('.svg')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Helper: upload a buffer to Cloudinary
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

// Helper: delete a file from Cloudinary by public_id
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

// Helper: extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  const pathSegments = parts.slice(uploadIndex + 2); // skip 'upload' and version
  return pathSegments.join('/').split('.')[0]; // remove extension
};

// SVG validation (unchanged)
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

// GET all ebooks (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, title, description, content, file_url, file_type, is_html_mode, cover_image_url, created_at, updated_at 
      FROM ebooks 
      ORDER BY created_at DESC
    `);
    // No need to prepend baseUrl – Cloudinary URLs are absolute
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching ebooks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single ebook
router.get('/:id', verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT id, title, description, content, file_url, file_type, is_html_mode, cover_image_url, created_at, updated_at 
      FROM ebooks 
      WHERE id = ?
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ebook not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// View HTML ebook (unchanged)
router.get('/view/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send('<h1>Authentication required</h1>');
    }
    let decoded;
    try {
      decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).send('<h1>Invalid or expired token</h1>');
    }
    const [rows] = await pool.query(`
      SELECT content, file_type, title 
      FROM ebooks 
      WHERE id = ? AND file_type = 'html'
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).send('<h1>Ebook not found</h1>');
    }
    const ebook = rows[0];
    if (ebook.content) {
      let html = ebook.content;
      if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ebook.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.8;
      color: #e0e0e0;
      background-color: #0b0f1c;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 { color: #ffffff; }
    a { color: #00d4ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre, code { background-color: #1e293b; padding: 2px 8px; border-radius: 4px; }
    pre { padding: 15px; overflow-x: auto; }
    blockquote { border-left: 4px solid #00d4ff; padding-left: 15px; color: #b0bedb; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    .toc { background: #0f1422; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
    .toc a { display: block; padding: 8px 0; color: #b0bedb; }
    .toc a:hover { color: #00d4ff; }
    .chapter { border-bottom: 1px solid #2a3440; padding-bottom: 30px; margin-bottom: 30px; }
  </style>
</head>
<body>
  ${ebook.content}
</body>
</html>`;
      }
      return res.send(html);
    }
    res.status(404).send('<h1>Ebook content not available</h1>');
  } catch (err) {
    console.error('Error viewing ebook:', err);
    res.status(500).send('<h1>Error loading ebook</h1>');
  }
});

// CREATE ebook – upload to Cloudinary
router.post('/', verifyAdminToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, content, file_type, is_html_mode, image_url_data, image_code } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const file = req.files.file[0];
    const coverFile = req.files.cover ? req.files.cover[0] : null;

    let finalFileType = file_type || 'pdf';
    let finalIsHtmlMode = is_html_mode === 'true' || is_html_mode === true;
    if (content && (content.includes('<!DOCTYPE') || content.includes('<html'))) {
      finalIsHtmlMode = true;
      finalFileType = 'html';
    }

    // Upload main file to Cloudinary
    let fileUrl = await uploadToCloudinary(file.buffer, 'ebooks', `${Date.now()}-${file.originalname}`);

    // Upload cover
    let coverImageUrl = null;
    if (coverFile) {
      coverImageUrl = await uploadToCloudinary(coverFile.buffer, 'ebooks/covers', `${Date.now()}-cover-${coverFile.originalname}`);
    } else if (image_code && image_code.trim()) {
      const validation = validateAndCleanSvg(image_code);
      if (validation && validation.valid) {
        const buffer = Buffer.from(validation.svg, 'utf8');
        coverImageUrl = await uploadToCloudinary(buffer, 'ebooks/covers', `${Date.now()}-cover.svg`);
      } else {
        return res.status(400).json({
          success: false,
          message: validation ? validation.error : 'Invalid SVG code'
        });
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      // Convert base64 to buffer
      const base64Data = image_url_data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      coverImageUrl = await uploadToCloudinary(buffer, 'ebooks/covers', `${Date.now()}-cover`);
    }

    let finalContent = content || null;
    if (finalIsHtmlMode && !finalContent && file) {
      finalContent = file.buffer.toString('utf8');
    }

    const [result] = await pool.query(`
      INSERT INTO ebooks (
        title, description, content, file_url, file_type, is_html_mode, cover_image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      title,
      description || '',
      finalContent,
      fileUrl,
      finalFileType,
      finalIsHtmlMode ? 1 : 0,
      coverImageUrl
    ]);

    res.status(201).json({
      success: true,
      message: 'Ebook created successfully',
      data: { id: result.insertId, fileUrl, coverImageUrl }
    });
  } catch (err) {
    console.error('Error creating ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE ebook – handle Cloudinary file replacement
router.put('/:id', verifyAdminToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, file_type, is_html_mode, image_url_data, image_code } = req.body;

    const [existing] = await pool.query('SELECT * FROM ebooks WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Ebook not found' });
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

    // Handle main file
    if (req.files && req.files.file) {
      const file = req.files.file[0];
      // Delete old file from Cloudinary if exists
      if (existing[0].file_url) {
        const publicId = getPublicIdFromUrl(existing[0].file_url);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old file failed:', e));
        }
      }
      const newUrl = await uploadToCloudinary(file.buffer, 'ebooks', `${Date.now()}-${file.originalname}`);
      updates.push('file_url = ?');
      values.push(newUrl);
    }

    // Handle cover
    if (req.files && req.files.cover) {
      const cover = req.files.cover[0];
      if (existing[0].cover_image_url) {
        const publicId = getPublicIdFromUrl(existing[0].cover_image_url);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old cover failed:', e));
        }
      }
      const newCoverUrl = await uploadToCloudinary(cover.buffer, 'ebooks/covers', `${Date.now()}-cover-${cover.originalname}`);
      updates.push('cover_image_url = ?');
      values.push(newCoverUrl);
    } else if (image_code && image_code.trim()) {
      const validation = validateAndCleanSvg(image_code);
      if (validation && validation.valid) {
        if (existing[0].cover_image_url) {
          const publicId = getPublicIdFromUrl(existing[0].cover_image_url);
          if (publicId) {
            await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old cover failed:', e));
          }
        }
        const buffer = Buffer.from(validation.svg, 'utf8');
        const newCoverUrl = await uploadToCloudinary(buffer, 'ebooks/covers', `${Date.now()}-cover.svg`);
        updates.push('cover_image_url = ?');
        values.push(newCoverUrl);
      } else {
        return res.status(400).json({
          success: false,
          message: validation ? validation.error : 'Invalid SVG code'
        });
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      if (existing[0].cover_image_url) {
        const publicId = getPublicIdFromUrl(existing[0].cover_image_url);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(e => console.warn('Delete old cover failed:', e));
        }
      }
      const base64Data = image_url_data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const newCoverUrl = await uploadToCloudinary(buffer, 'ebooks/covers', `${Date.now()}-cover`);
      updates.push('cover_image_url = ?');
      values.push(newCoverUrl);
    }

    // Handle content and type
    let finalContent = content || existing[0].content;
    let finalIsHtmlMode = is_html_mode === 'true' || is_html_mode === true || existing[0].is_html_mode;
    if (content !== undefined) {
      finalContent = content;
      updates.push('content = ?');
      values.push(finalContent);
      if (content && (content.includes('<!DOCTYPE') || content.includes('<html'))) {
        finalIsHtmlMode = true;
      }
    }

    let finalFileType = file_type || existing[0].file_type;
    if (file_type) {
      updates.push('file_type = ?');
      values.push(file_type);
    } else if (finalIsHtmlMode) {
      updates.push('file_type = ?');
      values.push('html');
      finalFileType = 'html';
    }

    if (finalIsHtmlMode !== existing[0].is_html_mode) {
      updates.push('is_html_mode = ?');
      values.push(finalIsHtmlMode ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);
    const query = `UPDATE ebooks SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    res.json({ success: true, message: 'Ebook updated successfully' });
  } catch (err) {
    console.error('Error updating ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE ebook – remove from Cloudinary too
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT file_url, cover_image_url FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ebook not found' });
    }

    if (rows[0].file_url) {
      const publicId = getPublicIdFromUrl(rows[0].file_url);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(e => console.warn('Delete file failed:', e));
      }
    }
    if (rows[0].cover_image_url) {
      const publicId = getPublicIdFromUrl(rows[0].cover_image_url);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(e => console.warn('Delete cover failed:', e));
      }
    }

    await pool.query('DELETE FROM ebooks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Ebook deleted successfully' });
  } catch (err) {
    console.error('Error deleting ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DOWNLOAD ebook – redirect to Cloudinary URL for PDF, or serve HTML content
router.get('/download/:id', verifyUserToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT file_url, title, file_type, content FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ebook not found' });
    }
    const ebook = rows[0];
    if (ebook.file_type === 'html' && ebook.content) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(ebook.title)}.html"`);
      return res.send(ebook.content);
    }
    if (ebook.file_url) {
      // Redirect to Cloudinary URL
      return res.redirect(ebook.file_url);
    }
    res.status(404).json({ success: false, message: 'File not found' });
  } catch (err) {
    console.error('Error downloading ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;