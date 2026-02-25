import { Router, Request, Response } from 'express';
import path from 'path';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/search', (req: Request, res: Response): void => {
  const q = (req.query.q as string) || '';
  if (!q) { res.json({ users: [] }); return; }
  const users = db.prepare(
    `SELECT id, username, display_name, bio, avatar_url, status FROM users
     WHERE (username LIKE ? OR display_name LIKE ?) AND id != ?
     LIMIT 20`
  ).all(`%${q}%`, `%${q}%`, req.user!.id);
  res.json({ users });
});

router.get('/:id', (req: Request, res: Response): void => {
  const user = db.prepare(
    'SELECT id, username, display_name, bio, avatar_url, status FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
});

router.put('/profile', (req: Request, res: Response): void => {
  const { display_name, bio, status } = req.body;
  const now = Date.now();
  db.prepare(
    'UPDATE users SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio), status = COALESCE(?, status), updated_at = ? WHERE id = ?'
  ).run(display_name ?? null, bio ?? null, status ?? null, now, req.user!.id);
  const user = db.prepare('SELECT id, username, display_name, bio, avatar_url, status FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});

router.post('/avatar', upload.single('avatar'), (req: Request, res: Response): void => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?').run(avatarUrl, Date.now(), req.user!.id);
  const user = db.prepare('SELECT id, username, display_name, bio, avatar_url, status FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user, avatar_url: avatarUrl });
});

export default router;
