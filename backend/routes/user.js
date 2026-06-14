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
    let userId;
    if (rows.length === 0) {
      const [result] = await pool.query('INSERT INTO users (email) VALUES (?)', [email]);
      userId = result.insertId;
    } else {
      userId = rows[0].id;
    }
    const token = jwt.sign({ id: userId, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { id: userId, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;