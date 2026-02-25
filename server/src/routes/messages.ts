import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { Message } from '../types';

const router = Router();
router.use(authMiddleware);

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

router.get('/:chatId', (req: Request, res: Response): void => {
  const { chatId } = req.params;
  const before = req.query.before ? Number(req.query.before) : Date.now() + 1;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user!.id);
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId) as { is_public: number } | undefined;
  if (!chat) { res.status(404).json({ error: 'Chat not found' }); return; }
  if (!member && !chat.is_public) { res.status(403).json({ error: 'Forbidden' }); return; }

  const messages = db.prepare(
    'SELECT * FROM messages WHERE chat_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?'
  ).all(chatId, before, limit) as Message[];

  const result = getMessagesWithReactions(messages.reverse());
  const hasMore = messages.length === limit;
  res.json({ messages: result, hasMore });
});

router.post('/:chatId', (req: Request, res: Response): void => {
  const { chatId } = req.params;
  const { content, type, reply_to_id, file_url, file_name, file_size } = req.body;

  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user!.id);
  if (!member) { res.status(403).json({ error: 'Forbidden' }); return; }
  if (!content && !file_url) { res.status(400).json({ error: 'Content required' }); return; }

  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    `INSERT INTO messages (id, chat_id, user_id, content, type, file_url, file_name, file_size, reply_to_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, chatId, req.user!.id, content || '', type || 'text', file_url ?? null, file_name ?? null, file_size ?? null, reply_to_id ?? null, now, now);

  db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(now, chatId);

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
  const [result] = getMessagesWithReactions([msg]);
  res.status(201).json({ message: result });
});

router.put('/:chatId/:messageId', (req: Request, res: Response): void => {
  const { chatId, messageId } = req.params;
  const { content } = req.body;

  const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND chat_id = ?').get(messageId, chatId) as Message | undefined;
  if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }
  if (msg.user_id !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }

  const now = Date.now();
  db.prepare('UPDATE messages SET content = ?, is_edited = 1, updated_at = ? WHERE id = ?').run(content, now, messageId);
  const updated = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as Message;
  const [result] = getMessagesWithReactions([updated]);
  res.json({ message: result });
});

router.delete('/:chatId/:messageId', (req: Request, res: Response): void => {
  const { chatId, messageId } = req.params;
  const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND chat_id = ?').get(messageId, chatId) as Message | undefined;
  if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }

  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user!.id) as { role: string } | undefined;
  const canDelete = msg.user_id === req.user!.id || member?.role === 'owner' || member?.role === 'admin';
  if (!canDelete) { res.status(403).json({ error: 'Forbidden' }); return; }

  db.prepare('UPDATE messages SET is_deleted = 1, content = \'\', updated_at = ? WHERE id = ?').run(Date.now(), messageId);
  res.json({ success: true });
});

router.post('/:chatId/:messageId/react', (req: Request, res: Response): void => {
  const { chatId, messageId } = req.params;
  const { emoji } = req.body;

  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user!.id);
  if (!member) { res.status(403).json({ error: 'Forbidden' }); return; }

  const existing = db.prepare('SELECT * FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').get(messageId, req.user!.id, emoji);
  if (existing) {
    db.prepare('DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').run(messageId, req.user!.id, emoji);
    res.json({ removed: true });
  } else {
    db.prepare('INSERT INTO reactions (id, message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), messageId, req.user!.id, emoji, Date.now());
    res.json({ added: true });
  }
});

router.post('/:chatId/:messageId/pin', (req: Request, res: Response): void => {
  const { chatId, messageId } = req.params;
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user!.id) as { role: string } | undefined;
  if (!member) { res.status(403).json({ error: 'Forbidden' }); return; }

  const msg = db.prepare('SELECT is_pinned FROM messages WHERE id = ? AND chat_id = ?').get(messageId, chatId) as { is_pinned: number } | undefined;
  if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }

  const newPin = msg.is_pinned ? 0 : 1;
  db.prepare('UPDATE messages SET is_pinned = ?, updated_at = ? WHERE id = ?').run(newPin, Date.now(), messageId);
  res.json({ is_pinned: newPin === 1 });
});

router.post('/:chatId/:messageId/forward', (req: Request, res: Response): void => {
  const { chatId, messageId } = req.params;
  const { targetChatId } = req.body;

  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(targetChatId, req.user!.id);
  if (!member) { res.status(403).json({ error: 'Forbidden' }); return; }

  const original = db.prepare('SELECT * FROM messages WHERE id = ? AND chat_id = ?').get(messageId, chatId) as Message | undefined;
  if (!original) { res.status(404).json({ error: 'Message not found' }); return; }

  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    `INSERT INTO messages (id, chat_id, user_id, content, type, file_url, file_name, file_size, forwarded_from_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, targetChatId, req.user!.id, original.content, original.type, original.file_url, original.file_name, original.file_size, messageId, now, now);

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
  const [result] = getMessagesWithReactions([msg]);
  res.status(201).json({ message: result });
});

router.get('/:chatId/pinned', (req: Request, res: Response): void => {
  const { chatId } = req.params;
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user!.id);
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId) as { is_public: number } | undefined;
  if (!chat) { res.status(404).json({ error: 'Chat not found' }); return; }
  if (!member && !chat.is_public) { res.status(403).json({ error: 'Forbidden' }); return; }

  const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? AND is_pinned = 1 ORDER BY created_at DESC').all(chatId) as Message[];
  res.json({ messages: getMessagesWithReactions(messages) });
});

export default router;
