const jwt = require('jsonwebtoken');
const db = require('../db');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    onlineUsers.set(user.id, socket.id);

    // Join all user's conversation rooms
    const conversations = db.prepare(`
      SELECT conversation_id FROM conversation_members WHERE user_id = ?
    `).all(user.id);
    conversations.forEach(c => socket.join(`conv_${c.conversation_id}`));

    // Broadcast online status
    io.emit('user_online', { userId: user.id });

    socket.on('send_message', (data, callback) => {
      const { conversation_id, content, type = 'text', file_url, file_name } = data;
      
      // Verify membership
      const member = db.prepare(
        'SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?'
      ).get(conversation_id, user.id);
      if (!member) return callback?.({ error: 'Not a member' });

      const result = db.prepare(`
        INSERT INTO messages (conversation_id, sender_id, content, type, file_url, file_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(conversation_id, user.id, content || '', type, file_url || null, file_name || null);

      const message = db.prepare(`
        SELECT m.*, u.username as sender_username, u.avatar_color as sender_avatar_color
        FROM messages m JOIN users u ON u.id = m.sender_id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      io.to(`conv_${conversation_id}`).emit('new_message', message);
      callback?.({ success: true, message });
    });

    socket.on('typing_start', ({ conversation_id }) => {
      socket.to(`conv_${conversation_id}`).emit('user_typing', {
        userId: user.id,
        username: user.username,
        conversation_id
      });
    });

    socket.on('typing_stop', ({ conversation_id }) => {
      socket.to(`conv_${conversation_id}`).emit('user_stopped_typing', {
        userId: user.id,
        conversation_id
      });
    });

    socket.on('join_conversation', (conversation_id) => {
      socket.join(`conv_${conversation_id}`);
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(user.id);
      db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      io.emit('user_offline', { userId: user.id });
    });
  });

  return { onlineUsers };
};
