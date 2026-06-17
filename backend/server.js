require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5001;

// Create upload directories
['uploads', 'uploads/posts', 'uploads/ebooks'].forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${fullPath}`);
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes - order matters for /:id routes!
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/ebooks', require('./routes/ebooks'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

// ✅ Debug endpoint
app.get('/api/debug/files', async (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads/ebooks');
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ success: true, files, directory: uploadsDir });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${path.join(__dirname, 'uploads')}`);
});