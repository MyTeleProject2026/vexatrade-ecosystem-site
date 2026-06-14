const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

module.exports = router;