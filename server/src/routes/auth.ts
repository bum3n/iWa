import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { User } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'iwa-secret-key-change-in-production';

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', (req: Request, res: Response): void => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password || !display_name) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password too short' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email) as { id: string } | undefined;
  if (existing) {
    res.status(409).json({ error: 'Username or email already taken' });
    return;
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);
  const now = Date.now();

  db.prepare(
    'INSERT INTO users (id, username, email, password_hash, display_name, bio, avatar_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, username, email, password_hash, display_name, '', '', 'online', now, now);

  const user = db.prepare('SELECT id, username, display_name, bio, avatar_url, status FROM users WHERE id = ?').get(id);
  const token = signToken(id);
  res.status(201).json({ token, user });
});

router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run('online', Date.now(), user.id);
  const publicUser = db.prepare('SELECT id, username, display_name, bio, avatar_url, status FROM users WHERE id = ?').get(user.id);
  const token = signToken(user.id);
  res.json({ token, user: publicUser });
});

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

router.post('/logout', authMiddleware, (req: Request, res: Response): void => {
  if (req.user) {
    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run('offline', Date.now(), req.user.id);
  }
  res.json({ success: true });
});

export default router;
