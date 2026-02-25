import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDb } from './db/schema';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import chatsRoutes from './routes/chats';
import messagesRoutes from './routes/messages';
import channelsRoutes from './routes/channels';
import uploadsRoutes from './routes/uploads';
import { setupSocket } from './socket';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload dirs exist
['uploads/avatars', 'uploads/attachments'].forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/uploads', uploadsRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Init DB & start
initDb();
setupSocket(io);

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`iWa server running on port ${PORT}`);
});

export default app;
