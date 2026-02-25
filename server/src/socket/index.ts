import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'iwa-secret-key-change-in-production';

const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

function getMessagesWithReactions(messages: Message[]) {
  return messages.map(msg => {
    const reactions = db.prepare(
      `SELECT r.emoji, r.user_id, u.display_name FROM reactions r
       JOIN users u ON r.user_id = u.id WHERE r.message_id = ?`
    ).all(msg.id);
    const sender = db.prepare('SELECT id, username, display_name, avatar_url FROM users WHERE id = ?').get(msg.user_id);
    let replyTo = null;
    if (msg.reply_to_id) {
      replyTo = db.prepare('SELECT id, content, user_id FROM messages WHERE id = ?').get(msg.reply_to_id);
    }
    return { ...msg, reactions, sender, replyTo };
  });
}

export function setupSocket(io: Server): void {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) { next(new Error('Authentication required')); return; }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = db.prepare('SELECT id, username, display_name, avatar_url, status FROM users WHERE id = ?').get(payload.userId);
      if (!user) { next(new Error('User not found')); return; }
      (socket as any).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as { id: string; username: string; display_name: string };

    // Track online
    if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
    onlineUsers.get(user.id)!.add(socket.id);
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('online', user.id);
    io.emit('user:online', { userId: user.id });

    // Join user's chats
    const chats = db.prepare('SELECT chat_id FROM chat_members WHERE user_id = ?').all(user.id) as { chat_id: string }[];
    for (const { chat_id } of chats) socket.join(chat_id);

    socket.on('message:send', (data: { chatId: string; content: string; type?: string; reply_to_id?: string; file_url?: string; file_name?: string; file_size?: number }) => {
      const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(data.chatId, user.id);
      if (!member) return;

      const id = uuidv4();
      const now = Date.now();
      db.prepare(
        `INSERT INTO messages (id, chat_id, user_id, content, type, file_url, file_name, file_size, reply_to_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, data.chatId, user.id, data.content || '', data.type || 'text', data.file_url ?? null, data.file_name ?? null, data.file_size ?? null, data.reply_to_id ?? null, now, now);
      db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(now, data.chatId);

      const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
      const [result] = getMessagesWithReactions([msg]);
      io.to(data.chatId).emit('message:new', { message: result });
    });

    socket.on('message:edit', (data: { chatId: string; messageId: string; content: string }) => {
      const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND chat_id = ? AND user_id = ?').get(data.messageId, data.chatId, user.id) as Message | undefined;
      if (!msg) return;
      const now = Date.now();
      db.prepare('UPDATE messages SET content = ?, is_edited = 1, updated_at = ? WHERE id = ?').run(data.content, now, data.messageId);
      const updated = db.prepare('SELECT * FROM messages WHERE id = ?').get(data.messageId) as Message;
      const [result] = getMessagesWithReactions([updated]);
      io.to(data.chatId).emit('message:updated', { message: result });
    });

    socket.on('message:delete', (data: { chatId: string; messageId: string }) => {
      const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND chat_id = ?').get(data.messageId, data.chatId) as Message | undefined;
      if (!msg) return;
      const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(data.chatId, user.id) as { role: string } | undefined;
      const canDelete = msg.user_id === user.id || member?.role === 'owner' || member?.role === 'admin';
      if (!canDelete) return;
      db.prepare('UPDATE messages SET is_deleted = 1, content = \'\', updated_at = ? WHERE id = ?').run(Date.now(), data.messageId);
      io.to(data.chatId).emit('message:deleted', { messageId: data.messageId, chatId: data.chatId });
    });

    socket.on('typing:start', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('typing:start', { userId: user.id, displayName: user.display_name, chatId: data.chatId });
    });

    socket.on('typing:stop', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('typing:stop', { userId: user.id, chatId: data.chatId });
    });

    socket.on('message:read', (data: { chatId: string }) => {
      db.prepare('UPDATE chat_members SET last_read_at = ? WHERE chat_id = ? AND user_id = ?').run(Date.now(), data.chatId, user.id);
      socket.to(data.chatId).emit('message:read', { userId: user.id, chatId: data.chatId });
    });

    socket.on('chat:join', (data: { chatId: string }) => {
      socket.join(data.chatId);
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(user.id);
          db.prepare('UPDATE users SET status = ? WHERE id = ?').run('offline', user.id);
          io.emit('user:offline', { userId: user.id });
        }
      }
    });
  });
}
