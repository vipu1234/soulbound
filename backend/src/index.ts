import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { initDB } from './db';
import { encrypt } from './utils/crypto';
import pool from './db';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import searchRoutes from './routes/search';
import interestRoutes from './routes/interests';
import chatRoutes from './routes/chat';
import privacyRoutes from './routes/privacy';
import reportRoutes from './routes/reports';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
});

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// ─── Socket.io — Real-time Chat ───────────────────────────────
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    (socket as any).userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string;
  onlineUsers.set(userId, socket.id);
  console.log(`🟢 User connected: ${userId}`);

  socket.on('send_message', async ({ to, content }: { to: string; content: string }) => {
    try {
      const conn = await pool.query(
        `SELECT status FROM interests
         WHERE ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))
         AND status='accepted'`,
        [userId, to]
      );
      if (!conn.rows.length) { socket.emit('error', { message: 'Not connected' }); return; }

      const encrypted = encrypt(content.trim());
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING message_id, created_at`,
        [userId, to, encrypted]
      );

      const row = result.rows[0] as any;
      const payload = { message_id: row?.message_id, sender_id: userId, content, created_at: row?.created_at };

      // Send to recipient if online
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) io.to(recipientSocketId).emit('new_message', payload);
      socket.emit('message_sent', payload);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`🔴 User disconnected: ${userId}`);
  });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  await initDB();
  console.log(`\n🚀 SoulBound API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 CORS allowed for: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
