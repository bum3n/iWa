import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { Chat } from '../types';

const router = Router();
router.use(authMiddleware);

router.get('/public', (req: Request, res: Response): void => {
  const channels = db.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) as member_count
     FROM chats c WHERE c.type = 'channel' AND c.is_public = 1 ORDER BY member_count DESC`
  ).all();
  res.json({ channels });
});

router.post('/', (req: Request, res: Response): void => {
  const { name, description, is_public } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }

  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    'INSERT INTO chats (id, type, name, description, is_public, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, 'channel', name, description ?? '', is_public ? 1 : 0, req.user!.id, now, now);
  db.prepare('INSERT INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, req.user!.id, 'owner', now);

  const channel = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
  res.status(201).json({ channel });
});

router.get('/:id', (req: Request, res: Response): void => {
  const channel = db.prepare('SELECT * FROM chats WHERE id = ? AND type = ?').get(req.params.id, 'channel') as Chat | undefined;
  if (!channel) { res.status(404).json({ error: 'Channel not found' }); return; }
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!channel.is_public && !member) { res.status(403).json({ error: 'Forbidden' }); return; }
  const members = db.prepare(
    `SELECT cm.*, u.username, u.display_name, u.avatar_url FROM chat_members cm
     JOIN users u ON cm.user_id = u.id WHERE cm.chat_id = ?`
  ).all(req.params.id);
  res.json({ channel, members });
});

router.post('/:id/join', (req: Request, res: Response): void => {
  const channel = db.prepare('SELECT * FROM chats WHERE id = ? AND type = ?').get(req.params.id, 'channel') as Chat | undefined;
  if (!channel) { res.status(404).json({ error: 'Channel not found' }); return; }
  if (!channel.is_public) { res.status(403).json({ error: 'Channel is private' }); return; }
  db.prepare('INSERT OR IGNORE INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, req.user!.id, 'member', Date.now());
  res.json({ success: true });
});

router.delete('/:id/leave', (req: Request, res: Response): void => {
  db.prepare('DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

export default router;
