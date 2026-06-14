require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5001;

// Create upload directories
['uploads', 'uploads/posts', 'uploads/ebooks'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/ebooks', require('./routes/ebooks'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});