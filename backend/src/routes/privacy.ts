import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Get privacy settings ─────────────────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`SELECT * FROM privacy_settings WHERE user_id=$1`, [req.userId]);
    res.json(result.rows[0] || {});
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Update privacy settings ──────────────────────────────────
router.put('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { photo_visibility, contact_visibility, show_online_status, is_hidden } = req.body;
  try {
    await pool.query(
      `UPDATE privacy_settings SET
        photo_visibility=COALESCE($1,photo_visibility),
        contact_visibility=COALESCE($2,contact_visibility),
        show_online_status=COALESCE($3,show_online_status),
        is_hidden=COALESCE($4,is_hidden),
        updated_at=NOW()
       WHERE user_id=$5`,
      [photo_visibility, contact_visibility, show_online_status, is_hidden, req.userId]
    );
    res.json({ message: 'Privacy settings updated' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Toggle Ghost Mode ─────────────────────────────────────────
router.post('/ghost', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(
      `UPDATE privacy_settings SET is_hidden = CASE WHEN is_hidden = 0 THEN 1 ELSE 0 END, updated_at=datetime('now')
       WHERE user_id=$1`,
      [req.userId]
    );
    const result = await pool.query(
      `SELECT is_hidden FROM privacy_settings WHERE user_id=$1`,
      [req.userId]
    );
    const hidden = result.rows[0]?.is_hidden;
    res.json({ is_hidden: hidden, message: hidden ? '🫥 Profile hidden (Ghost Mode ON)' : '👁️ Profile visible' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Pause / Delete account ────────────────────────────────────
router.post('/account-status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { action } = req.body; // 'paused' | 'deleted' | 'active'
  if (!['paused', 'deleted', 'active'].includes(action)) {
    res.status(400).json({ error: 'action must be paused, deleted, or active' }); return;
  }
  try {
    await pool.query(`UPDATE users SET status=$1, updated_at=NOW() WHERE user_id=$2`, [action, req.userId]);
    res.json({ message: `Account ${action}` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
