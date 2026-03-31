import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Submit a report ──────────────────────────────────────────
router.post('/:reportedUserId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { reportedUserId } = req.params;
  const { reason, description } = req.body;
  const validReasons = ['fake_profile', 'harassment', 'inappropriate_content', 'other'];
  if (!validReasons.includes(reason)) { res.status(400).json({ error: 'Invalid reason' }); return; }

  try {
    await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, reason, description) VALUES ($1,$2,$3,$4)`,
      [req.userId, reportedUserId, reason, description]
    );

    // Auto-shadow-ban after 3 pending/reviewed reports
    const countResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM reports WHERE reported_id=$1 AND status != 'dismissed'`,
      [reportedUserId]
    );
    if (Number(countResult.rows[0]?.cnt || 0) >= 3) {
      await pool.query(`UPDATE users SET status='suspended' WHERE user_id=$1`, [reportedUserId]);
      console.log(`🚫 User ${reportedUserId} auto-suspended after 3 reports`);
    }

    res.json({ message: 'Report submitted. Our team will review it shortly.' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: list reports ──────────────────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT r.*, rp.full_name AS reporter_name, dp.full_name AS reported_name
       FROM reports r
       LEFT JOIN profiles rp ON rp.user_id = r.reporter_id
       LEFT JOIN profiles dp ON dp.user_id = r.reported_id
       ORDER BY r.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
