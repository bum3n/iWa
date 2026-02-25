const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const users = db.prepare(
    'SELECT id, username, avatar_color, last_seen FROM users WHERE id != ? ORDER BY username'
  ).all(req.user.id);
  res.json(users);
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, avatar_color, last_seen FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

module.exports = router;
