import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { generateOTP, sendOTPEmail } from '../utils/otp';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Register (Step 1: send OTP) ─────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }

  try {
    const exists = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
    if (exists.rows.length > 0) { res.status(409).json({ error: 'Email already registered' }); return; }

    const hash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, otp, otp_expires) VALUES ($1,$2,$3,$4) RETURNING user_id`,
      [email, hash, otp, expires]
    );
    const userId = userResult.rows[0].user_id;

    // Create empty profile & privacy row
    await pool.query(`INSERT INTO profiles (user_id) VALUES ($1)`, [userId]);
    await pool.query(`INSERT INTO privacy_settings (user_id) VALUES ($1)`, [userId]);
    await pool.query(`INSERT INTO partner_preferences (user_id) VALUES ($1)`, [userId]);

    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to email', userId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Verify OTP ────────────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query(
      `SELECT user_id, otp, otp_expires FROM users WHERE email=$1`, [email]
    );
    if (!result.rows.length) { res.status(404).json({ error: 'User not found' }); return; }

    const user = result.rows[0];
    if (user.otp !== otp) { res.status(400).json({ error: 'Invalid OTP' }); return; }
    if (new Date() > new Date(user.otp_expires)) { res.status(400).json({ error: 'OTP expired' }); return; }

    await pool.query(
      `UPDATE users SET is_verified=TRUE, otp=NULL, otp_expires=NULL WHERE user_id=$1`,
      [user.user_id]
    );

    const { accessToken, refreshToken } = generateTokens(user.user_id);
    await pool.query(`UPDATE users SET refresh_token=$1 WHERE user_id=$2`, [refreshToken, user.user_id]);

    res.json({ message: 'Verified', accessToken, refreshToken, userId: user.user_id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT user_id, password_hash, is_verified, status FROM users WHERE email=$1`, [email]
    );
    if (!result.rows.length) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const user = result.rows[0];
    if (user.status === 'deleted') { res.status(403).json({ error: 'Account deleted' }); return; }
    if (user.status === 'suspended') { res.status(403).json({ error: 'Account suspended due to reports' }); return; }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    if (!user.is_verified) { res.status(403).json({ error: 'Please verify your email first' }); return; }

    const { accessToken, refreshToken } = generateTokens(user.user_id);
    await pool.query(`UPDATE users SET refresh_token=$1 WHERE user_id=$2`, [refreshToken, user.user_id]);

    res.json({ accessToken, refreshToken, userId: user.user_id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Refresh Token ────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as { userId: string };
    const result = await pool.query(`SELECT refresh_token FROM users WHERE user_id=$1`, [decoded.userId]);
    if (!result.rows.length || result.rows[0].refresh_token !== refreshToken) {
      res.status(401).json({ error: 'Invalid refresh token' }); return;
    }
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);
    await pool.query(`UPDATE users SET refresh_token=$1 WHERE user_id=$2`, [newRefresh, decoded.userId]);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── Resend OTP ────────────────────────────────────────────────
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    const result = await pool.query(`SELECT user_id FROM users WHERE email=$1`, [email]);
    if (!result.rows.length) { res.status(404).json({ error: 'User not found' }); return; }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await pool.query(`UPDATE users SET otp=$1, otp_expires=$2 WHERE email=$3`, [otp, expires, email]);
    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP resent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Me ────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.email, u.is_verified, u.trust_score, u.status,
              p.full_name, p.photo_url, p.wizard_step, p.gender
       FROM users u LEFT JOIN profiles p ON u.user_id = p.user_id
       WHERE u.user_id = $1`, [req.userId]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Logout ───────────────────────────────────────────────────
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query(`UPDATE users SET refresh_token=NULL WHERE user_id=$1`, [req.userId]);
  res.json({ message: 'Logged out' });
});

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export default router;
