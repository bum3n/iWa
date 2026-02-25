const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const conversations = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) as member_count,
      (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
      (SELECT u.username FROM users u 
       JOIN conversation_members cm2 ON cm2.user_id = u.id 
       WHERE cm2.conversation_id = c.id AND u.id != ? LIMIT 1) as other_username,
      (SELECT u.avatar_color FROM users u 
       JOIN conversation_members cm3 ON cm3.user_id = u.id 
       WHERE cm3.conversation_id = c.id AND u.id != ? LIMIT 1) as other_avatar_color,
      (SELECT u.id FROM users u 
       JOIN conversation_members cm4 ON cm4.user_id = u.id 
       WHERE cm4.conversation_id = c.id AND u.id != ? LIMIT 1) as other_user_id
    FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ?
    ORDER BY COALESCE(last_message_at, c.created_at) DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id);
  
  res.json(conversations);
});

router.post('/', authMiddleware, (req, res) => {
  const { type, name, description, member_ids } = req.body;
  
  if (!type || !['direct', 'group', 'channel'].includes(type)) {
    return res.status(400).json({ error: 'Invalid conversation type' });
  }

  if (type === 'direct') {
    if (!member_ids || member_ids.length !== 1) {
      return res.status(400).json({ error: 'Direct chat requires exactly one other user' });
    }
    const otherId = member_ids[0];
    
    // Check if direct conversation already exists
    const existing = db.prepare(`
      SELECT c.id FROM conversations c
      JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = ?
      JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = ?
      WHERE c.type = 'direct'
    `).get(req.user.id, otherId);
    
    if (existing) {
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(existing.id);
      return res.json(conv);
    }

    const result = db.prepare(
      'INSERT INTO conversations (type, created_by) VALUES (?, ?)'
    ).run('direct', req.user.id);
    
    const convId = result.lastInsertRowid;
    db.prepare('INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, ?)').run(convId, req.user.id, 'admin');
    db.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)').run(convId, otherId);
    
    return res.json({ id: convId, type: 'direct', created_by: req.user.id });
  }

  if (!name) {
    return res.status(400).json({ error: 'Name required for group/channel' });
  }

  const COLORS = ['#e17055','#00b894','#0984e3','#6c5ce7','#fd79a8','#fdcb6e'];
  const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  
  const result = db.prepare(
    'INSERT INTO conversations (type, name, description, avatar_color, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(type, name, description || '', avatarColor, req.user.id);
  
  const convId = result.lastInsertRowid;
  db.prepare('INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, ?)').run(convId, req.user.id, 'admin');
  
  if (member_ids && member_ids.length > 0) {
    const insertMember = db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)');
    for (const uid of member_ids) {
      insertMember.run(convId, uid);
    }
  }

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
  res.json(conv);
});

router.get('/:id/messages', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { before, limit = 50 } = req.query;
  
  // Verify membership
  const member = db.prepare(
    'SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?'
  ).get(id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  let query = `
    SELECT m.*, u.username as sender_username, u.avatar_color as sender_avatar_color
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ?
  `;
  const params = [id];
  
  if (before) {
    query += ' AND m.id < ?';
    params.push(before);
  }
  query += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const messages = db.prepare(query).all(...params);
  res.json(messages.reverse());
});

module.exports = router;
