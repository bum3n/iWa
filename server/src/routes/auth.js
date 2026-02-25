const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const AVATAR_COLORS = [
  '#e17055', '#00b894', '#0984e3', '#6c5ce7',
  '#fd79a8', '#fdcb6e', '#55efc4', '#74b9ff'
];

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const result = db.prepare(
    'INSERT INTO users (username, password, avatar_color) VALUES (?, ?, ?)'
  ).run(username, hashedPassword, avatarColor);

  const user = { id: result.lastInsertRowid, username, avatar_color: avatarColor };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const userData = { id: user.id, username: user.username, avatar_color: user.avatar_color };
  const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user: userData });
});

module.exports = router;
