import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { Chat, ChatMember, Message } from '../types';

const router = Router();
router.use(authMiddleware);

function getChatWithDetails(chatId: string, userId: string) {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId) as Chat | undefined;
  if (!chat) return null;

  const members = db.prepare(
    `SELECT cm.*, u.username, u.display_name, u.avatar_url, u.status
     FROM chat_members cm JOIN users u ON cm.user_id = u.id
     WHERE cm.chat_id = ?`
  ).all(chatId);

  const lastMessage = db.prepare(
    'SELECT * FROM messages WHERE chat_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1'
  ).get(chatId) as Message | undefined;

  const unread = db.prepare(
    `SELECT COUNT(*) as count FROM messages m
     JOIN chat_members cm ON cm.chat_id = m.chat_id AND cm.user_id = ?
     WHERE m.chat_id = ? AND m.created_at > cm.last_read_at AND m.is_deleted = 0 AND m.user_id != ?`
  ).get(userId, chatId, userId) as { count: number };

  if (chat.type === 'direct') {
    const other = (members as Array<ChatMember & { username: string; display_name: string; avatar_url: string; status: string }>)
      .find(m => m.user_id !== userId);
    return { ...chat, name: other?.display_name ?? chat.name, avatar_url: other?.avatar_url ?? chat.avatar_url, members, lastMessage: lastMessage ?? null, unreadCount: unread.count };
  }
  return { ...chat, members, lastMessage: lastMessage ?? null, unreadCount: unread.count };
}

router.get('/', (req: Request, res: Response): void => {
  const memberRows = db.prepare(
    'SELECT chat_id FROM chat_members WHERE user_id = ?'
  ).all(req.user!.id) as { chat_id: string }[];

  const chats = memberRows
    .map(row => getChatWithDetails(row.chat_id, req.user!.id))
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const aTime = a.lastMessage?.created_at ?? a.created_at;
      const bTime = b.lastMessage?.created_at ?? b.created_at;
      return bTime - aTime;
    });

  res.json({ chats });
});

router.post('/direct', (req: Request, res: Response): void => {
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ error: 'userId required' }); return; }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }

  // Check existing
  const existing = db.prepare(
    `SELECT c.id FROM chats c
     JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = ?
     JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = ?
     WHERE c.type = 'direct'`
  ).get(req.user!.id, userId) as { id: string } | undefined;

  if (existing) {
    res.json(getChatWithDetails(existing.id, req.user!.id));
    return;
  }

  const id = uuidv4();
  const now = Date.now();
  db.prepare('INSERT INTO chats (id, type, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, 'direct', null, now, now);
  db.prepare('INSERT INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, req.user!.id, 'member', now);
  db.prepare('INSERT INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, userId, 'member', now);

  res.status(201).json(getChatWithDetails(id, req.user!.id));
});

router.post('/group', (req: Request, res: Response): void => {
  const { name, description, memberIds } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }

  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    'INSERT INTO chats (id, type, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, 'group', name, description ?? '', req.user!.id, now, now);
  db.prepare('INSERT INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, req.user!.id, 'owner', now);

  if (Array.isArray(memberIds)) {
    for (const uid of memberIds) {
      if (uid !== req.user!.id) {
        db.prepare('INSERT OR IGNORE INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, uid, 'member', now);
      }
    }
  }

  res.status(201).json(getChatWithDetails(id, req.user!.id));
});

router.get('/:id', (req: Request, res: Response): void => {
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id) as Chat | undefined;
  if (!chat) { res.status(404).json({ error: 'Chat not found' }); return; }
  if (!member && !chat.is_public) { res.status(403).json({ error: 'Forbidden' }); return; }
  res.json(getChatWithDetails(req.params.id, req.user!.id));
});

router.put('/:id', (req: Request, res: Response): void => {
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as ChatMember | undefined;
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const { name, description, avatar_url, is_public } = req.body;
  db.prepare(
    'UPDATE chats SET name = COALESCE(?, name), description = COALESCE(?, description), avatar_url = COALESCE(?, avatar_url), is_public = COALESCE(?, is_public), updated_at = ? WHERE id = ?'
  ).run(name ?? null, description ?? null, avatar_url ?? null, is_public ?? null, Date.now(), req.params.id);
  res.json(getChatWithDetails(req.params.id, req.user!.id));
});

router.post('/:id/members', (req: Request, res: Response): void => {
  const { userId } = req.body;
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as ChatMember | undefined;
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  db.prepare('INSERT OR IGNORE INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, userId, 'member', Date.now());
  res.json({ success: true });
});

router.delete('/:id/members/:userId', (req: Request, res: Response): void => {
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as ChatMember | undefined;
  if (!member) { res.status(403).json({ error: 'Forbidden' }); return; }
  if (req.params.userId !== req.user!.id && member.role !== 'owner' && member.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  db.prepare('DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ success: true });
});

router.put('/:id/members/:userId/role', (req: Request, res: Response): void => {
  const { role } = req.body;
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as ChatMember | undefined;
  if (!member || member.role !== 'owner') { res.status(403).json({ error: 'Forbidden' }); return; }
  db.prepare('UPDATE chat_members SET role = ? WHERE chat_id = ? AND user_id = ?').run(role, req.params.id, req.params.userId);
  res.json({ success: true });
});

router.post('/:id/join', (req: Request, res: Response): void => {
  const { inviteCode } = req.body;
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id) as Chat | undefined;
  if (!chat) { res.status(404).json({ error: 'Chat not found' }); return; }
  if (!chat.is_public && chat.invite_code !== inviteCode) {
    res.status(403).json({ error: 'Invalid invite code' }); return;
  }
  const now = Date.now();
  db.prepare('INSERT OR IGNORE INTO chat_members (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, req.user!.id, 'member', now);
  res.json(getChatWithDetails(req.params.id, req.user!.id));
});

router.post('/:id/invite', (req: Request, res: Response): void => {
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as ChatMember | undefined;
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const inviteCode = uuidv4().slice(0, 8);
  db.prepare('UPDATE chats SET invite_code = ? WHERE id = ?').run(inviteCode, req.params.id);
  res.json({ inviteCode });
});

export default router;
