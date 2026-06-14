const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email required' });
  }
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      const [result] = await pool.query('INSERT INTO users (email) VALUES (?)', [email]);
      const token = jwt.sign({ id: result.insertId, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.json({ success: true, token, user: { id: result.insertId, email } });
    } else {
      const token = jwt.sign({ id: rows[0].id, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.json({ success: true, token, user: { id: rows[0].id, email } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;