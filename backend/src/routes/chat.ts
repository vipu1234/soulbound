import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/crypto';

const router = Router();

// ─── Get chat history ─────────────────────────────────────────
router.get('/:partnerId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { partnerId } = req.params;
  try {
    // Verify they are connected
    const conn = await pool.query(
      `SELECT status FROM interests
       WHERE ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))
       AND status='accepted'`,
      [req.userId, partnerId]
    );
    if (!conn.rows.length) { res.status(403).json({ error: 'Must be connected to chat' }); return; }

    const result = await pool.query(
      `SELECT message_id, sender_id, receiver_id, content, is_read, created_at
       FROM messages
       WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY created_at ASC`,
      [req.userId, partnerId]
    );

    // Mark as read
    await pool.query(
      `UPDATE messages SET is_read=TRUE WHERE receiver_id=$1 AND sender_id=$2 AND is_read=FALSE`,
      [req.userId, partnerId]
    );

    const messages = result.rows.map(m => ({
      ...m,
      content: (() => { try { return decrypt(m.content); } catch { return '[encrypted]'; } })(),
    }));
    res.json(messages);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Send message (REST fallback) ─────────────────────────────
router.post('/:partnerId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { partnerId } = req.params;
  const { content } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: 'Message cannot be empty' }); return; }

  try {
    const conn = await pool.query(
      `SELECT status FROM interests
       WHERE ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))
       AND status='accepted'`,
      [req.userId, partnerId]
    );
    if (!conn.rows.length) { res.status(403).json({ error: 'Must be connected to chat' }); return; }

    const encrypted = encrypt(content.trim());
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING message_id, created_at`,
      [req.userId, partnerId, encrypted]
    );
    res.json({ message_id: result.rows[0].message_id, content, created_at: result.rows[0].created_at });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
