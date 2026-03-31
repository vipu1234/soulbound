import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Send Interest ─────────────────────────────────────────────
router.post('/:targetUserId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { targetUserId } = req.params;
  if (targetUserId === req.userId) { res.status(400).json({ error: 'Cannot send interest to yourself' }); return; }
  try {
    await pool.query(
      `INSERT INTO interests (sender_id, receiver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.userId, targetUserId]
    );
    res.json({ message: 'Interest sent' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Respond to Interest ───────────────────────────────────────
router.put('/:interestId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { interestId } = req.params;
  const { action } = req.body; // 'accepted' | 'rejected'
  if (!['accepted', 'rejected'].includes(action)) { res.status(400).json({ error: 'action must be accepted or rejected' }); return; }
  try {
    const result = await pool.query(
      `UPDATE interests SET status=$1, updated_at=NOW()
       WHERE interest_id=$2 AND receiver_id=$3 AND status='pending'
       RETURNING *`,
      [action, interestId, req.userId]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Interest not found or not pending' }); return; }
    res.json({ message: `Interest ${action}`, interest: result.rows[0] });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Get received interests ────────────────────────────────────
router.get('/received', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT i.interest_id, i.sender_id, i.status, i.created_at,
              p.full_name, p.photo_url, p.occupation, p.current_city, p.religion, p.dob,
              u.is_verified, u.trust_score
       FROM interests i
       JOIN profiles p ON p.user_id = i.sender_id
       JOIN users u ON u.user_id = i.sender_id
       WHERE i.receiver_id = $1
       ORDER BY i.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Get sent interests ────────────────────────────────────────
router.get('/sent', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT i.interest_id, i.receiver_id, i.status, i.created_at,
              p.full_name, p.photo_url, p.occupation, p.current_city, p.religion, p.dob,
              u.is_verified, u.trust_score
       FROM interests i
       JOIN profiles p ON p.user_id = i.receiver_id
       JOIN users u ON u.user_id = i.receiver_id
       WHERE i.sender_id = $1
       ORDER BY i.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Get mutual connections (accepted) ────────────────────────
router.get('/connections', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT i.interest_id,
              CASE WHEN i.sender_id=$1 THEN i.receiver_id ELSE i.sender_id END AS partner_id,
              p.full_name, p.photo_url, p.occupation, p.current_city, i.updated_at,
              u.is_verified
       FROM interests i
       JOIN profiles p ON p.user_id = CASE WHEN i.sender_id=$1 THEN i.receiver_id ELSE i.sender_id END
       JOIN users u ON u.user_id = CASE WHEN i.sender_id=$1 THEN i.receiver_id ELSE i.sender_id END
       WHERE (i.sender_id=$1 OR i.receiver_id=$1) AND i.status='accepted'
       ORDER BY i.updated_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
