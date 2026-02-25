import { Router, Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/attachments'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/attachment', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const url = `/uploads/attachments/${req.file.filename}`;
  res.json({ url, filename: req.file.originalname, size: req.file.size });
});

export default router;
