const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// User login with email only (create user if not exists)
router.post('/login', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email required' });
  }
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!row) {
      // Create new user
      db.run('INSERT INTO users (email) VALUES (?)', [email], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        const token = jwt.sign({ id: this.lastID, email, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, token, user: { id: this.lastID, email } });
      });
    } else {
      const token = jwt.sign({ id: row.id, email, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ success: true, token, user: { id: row.id, email } });
    }
  });
});

module.exports = router;