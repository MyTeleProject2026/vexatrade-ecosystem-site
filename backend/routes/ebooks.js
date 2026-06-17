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
    const uploadDir = path.join(__dirname, '../../uploads/ebooks');
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

// Get all ebooks (user)
router.get('/', verifyUserToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, title, description, content, file_url, file_type, is_html_mode, cover_image_url, created_at, updated_at 
      FROM ebooks 
      ORDER BY created_at DESC
    `);
    
    const baseUrl = process.env.BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
    const ebooks = rows.map(ebook => ({
      ...ebook,
      file_url: ebook.file_url ? `${baseUrl}${ebook.file_url}` : null,
      cover_image_url: ebook.cover_image_url ? `${baseUrl}${ebook.cover_image_url}` : null
    }));
    
    res.json({ success: true, data: ebooks });
  } catch (err) {
    console.error('Error fetching ebooks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single ebook (user + admin)
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
    
    const baseUrl = process.env.BASE_URL || 'https://vexatrade-ecosystem-api.onrender.com';
    const ebook = {
      ...rows[0],
      file_url: rows[0].file_url ? `${baseUrl}${rows[0].file_url}` : null,
      cover_image_url: rows[0].cover_image_url ? `${baseUrl}${rows[0].cover_image_url}` : null
    };
    
    res.json({ success: true, data: ebook });
  } catch (err) {
    console.error('Error fetching ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// View HTML ebook (user)
router.get('/view/:id', verifyUserToken, async (req, res) => {
  try {
    const { id } = req.params;
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

// Create ebook (admin)
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
    
    let coverImageUrl = null;
    
    if (coverFile) {
      coverImageUrl = `/uploads/ebooks/${coverFile.filename}`;
    } else if (image_code && image_code.trim()) {
      let cleanSvg = validateAndCleanSvg(image_code);
      if (cleanSvg) {
        const svgFileName = `cover-${Date.now()}.svg`;
        const svgPath = path.join(__dirname, '../../uploads/ebooks/', svgFileName);
        fs.writeFileSync(svgPath, cleanSvg, 'utf8');
        coverImageUrl = `/uploads/ebooks/${svgFileName}`;
      } else {
        coverImageUrl = image_code;
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      coverImageUrl = image_url_data;
    }
    
    let finalContent = content || null;
    
    if (finalIsHtmlMode && !finalContent && file) {
      const filePath = path.join(__dirname, '../../uploads/ebooks/', file.filename);
      if (fs.existsSync(filePath)) {
        finalContent = fs.readFileSync(filePath, 'utf8');
      }
    }
    
    const fileUrl = `/uploads/ebooks/${file.filename}`;
    
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
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('Error creating ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update ebook (admin)
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
    
    let fileUrl = existing[0].file_url;
    if (req.files && req.files.file) {
      const file = req.files.file[0];
      fileUrl = `/uploads/ebooks/${file.filename}`;
      updates.push('file_url = ?');
      values.push(fileUrl);
      
      if (existing[0].file_url) {
        const oldFilePath = path.join(__dirname, '../..', existing[0].file_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }
    
    let coverImageUrl = existing[0].cover_image_url;
    
    if (req.files && req.files.cover) {
      const coverFile = req.files.cover[0];
      coverImageUrl = `/uploads/ebooks/${coverFile.filename}`;
      updates.push('cover_image_url = ?');
      values.push(coverImageUrl);
      
      if (existing[0].cover_image_url && !existing[0].cover_image_url.startsWith('data:')) {
        const oldCoverPath = path.join(__dirname, '../..', existing[0].cover_image_url);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }
    } else if (image_code && image_code.trim()) {
      let cleanSvg = validateAndCleanSvg(image_code);
      if (cleanSvg) {
        if (existing[0].cover_image_url && !existing[0].cover_image_url.startsWith('data:')) {
          const oldCoverPath = path.join(__dirname, '../..', existing[0].cover_image_url);
          if (fs.existsSync(oldCoverPath)) {
            fs.unlinkSync(oldCoverPath);
          }
        }
        
        const svgFileName = `cover-${Date.now()}.svg`;
        const svgPath = path.join(__dirname, '../../uploads/ebooks/', svgFileName);
        fs.writeFileSync(svgPath, cleanSvg, 'utf8');
        coverImageUrl = `/uploads/ebooks/${svgFileName}`;
        updates.push('cover_image_url = ?');
        values.push(coverImageUrl);
      } else {
        coverImageUrl = image_code;
        updates.push('cover_image_url = ?');
        values.push(coverImageUrl);
      }
    } else if (image_url_data && image_url_data.startsWith('data:image')) {
      coverImageUrl = image_url_data;
      updates.push('cover_image_url = ?');
      values.push(coverImageUrl);
    }
    
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
    
    res.json({
      success: true,
      message: 'Ebook updated successfully'
    });
  } catch (err) {
    console.error('Error updating ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete ebook (admin)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT file_url, cover_image_url FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ebook not found' });
    }
    
    if (rows[0].file_url) {
      const filePath = path.join(__dirname, '../..', rows[0].file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (rows[0].cover_image_url && !rows[0].cover_image_url.startsWith('data:')) {
      const coverPath = path.join(__dirname, '../..', rows[0].cover_image_url);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }
    
    await pool.query('DELETE FROM ebooks WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Ebook deleted successfully' });
  } catch (err) {
    console.error('Error deleting ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download ebook (user)
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
    
    const filePath = path.join(__dirname, '../..', ebook.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const ext = path.extname(ebook.file_url);
    res.download(filePath, `${ebook.title}${ext}`);
  } catch (err) {
    console.error('Error downloading ebook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;