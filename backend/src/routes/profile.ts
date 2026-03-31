import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { encrypt, decrypt } from '../utils/crypto';
import path from 'path';

const router = Router();

// ─── Get my profile ───────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, ps.photo_visibility, ps.contact_visibility, ps.show_online_status, ps.is_hidden
       FROM profiles p
       LEFT JOIN privacy_settings ps ON p.user_id = ps.user_id
       WHERE p.user_id = $1`, [req.userId]
    );
    res.json(result.rows[0] || {});
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Update profile (wizard step 1-3) ─────────────────────────
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    full_name, dob, gender, marital_status, religion, caste, mother_tongue,
    height_cm, weight_kg, blood_group, about_me, wizard_step,
    annual_income, occupation, company, education_level, education_field,
    current_city, current_state, current_country, hometown,
    lifestyle_diet, lifestyle_smoke, lifestyle_drink, manglik, disability,
    horoscope_data
  } = req.body;

  // Convert empty strings to null so COALESCE works properly
  const n = (v: any) => (v === '' || v === undefined ? null : v);

  try {
    await pool.query(
      `UPDATE profiles SET
        full_name=COALESCE($1, full_name),
        dob=COALESCE($2, dob),
        gender=COALESCE($3, gender),
        marital_status=COALESCE($4, marital_status),
        religion=COALESCE($5, religion),
        caste=COALESCE($6, caste),
        mother_tongue=COALESCE($7, mother_tongue),
        height_cm=COALESCE($8, height_cm),
        weight_kg=COALESCE($9, weight_kg),
        blood_group=COALESCE($10, blood_group),
        about_me=COALESCE($11, about_me),
        wizard_step=COALESCE($12, wizard_step),
        annual_income=COALESCE($13, annual_income),
        occupation=COALESCE($14, occupation),
        company=COALESCE($15, company),
        education_level=COALESCE($16, education_level),
        education_field=COALESCE($17, education_field),
        current_city=COALESCE($18, current_city),
        current_state=COALESCE($19, current_state),
        current_country=COALESCE($20, current_country),
        hometown=COALESCE($21, hometown),
        lifestyle_diet=COALESCE($22, lifestyle_diet),
        lifestyle_smoke=COALESCE($23, lifestyle_smoke),
        lifestyle_drink=COALESCE($24, lifestyle_drink),
        manglik=COALESCE($25, manglik),
        disability=COALESCE($26, disability),
        horoscope_data=COALESCE($27, horoscope_data),
        updated_at=datetime('now')
       WHERE user_id=$28`,
      [
        n(full_name), n(dob), n(gender), n(marital_status), n(religion), n(caste), n(mother_tongue),
        n(height_cm), n(weight_kg), n(blood_group), n(about_me), wizard_step,
        n(annual_income), n(occupation), n(company), n(education_level), n(education_field),
        n(current_city), n(current_state), n(current_country), n(hometown),
        n(lifestyle_diet), n(lifestyle_smoke), n(lifestyle_drink), n(manglik), n(disability),
        horoscope_data ? JSON.stringify(horoscope_data) : null,
        req.userId
      ]
    );
    res.json({ message: 'Profile updated' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Upload photo ─────────────────────────────────────────────
router.post('/photo', authMiddleware, upload.single('photo'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const photoUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query(`UPDATE profiles SET photo_url=$1, updated_at=NOW() WHERE user_id=$2`, [photoUrl, req.userId]);
    res.json({ photoUrl });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Upload Govt ID (encrypted) ───────────────────────────────
router.post('/govt-id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { govtId } = req.body;
  if (!govtId) { res.status(400).json({ error: 'govtId required' }); return; }
  try {
    const encrypted = encrypt(govtId);
    await pool.query(`UPDATE profiles SET govt_id_encrypted=$1 WHERE user_id=$2`, [encrypted, req.userId]);
    await pool.query(`UPDATE users SET is_verified=TRUE, trust_score=trust_score+50 WHERE user_id=$1`, [req.userId]);
    res.json({ message: 'Govt ID verified and encrypted', badge: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Get any profile by ID ────────────────────────────────────
router.get('/:profileUserId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { profileUserId } = req.params;
  try {
    const priv = await pool.query(
      `SELECT photo_visibility, is_hidden FROM privacy_settings WHERE user_id=$1`, [profileUserId]
    );
    const privRow = priv.rows[0];
    if (privRow?.is_hidden) { res.status(404).json({ error: 'Profile not found' }); return; }

    // Check if interests accepted for full contact visibility
    const accepted = await pool.query(
      `SELECT status FROM interests
       WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
       AND status='accepted'`, [req.userId, profileUserId]
    );
    const isConnected = accepted.rows.length > 0;

    const result = await pool.query(
      `SELECT p.profile_id, p.user_id, p.full_name, p.dob, p.gender, p.marital_status,
              p.religion, p.caste, p.mother_tongue, p.height_cm, p.weight_kg, p.blood_group,
              p.annual_income, p.occupation, p.company, p.education_level, p.education_field,
              p.current_city, p.current_state, p.current_country, p.hometown,
              p.lifestyle_diet, p.lifestyle_smoke, p.lifestyle_drink, p.manglik, p.disability,
              p.about_me, p.horoscope_data,
              u.is_verified, u.trust_score,
              ps.photo_visibility, ps.show_online_status,
              CASE WHEN ps.photo_visibility='accepted_only' AND $3=FALSE THEN NULL ELSE p.photo_url END AS photo_url
       FROM profiles p
       JOIN users u ON u.user_id = p.user_id
       JOIN privacy_settings ps ON ps.user_id = p.user_id
       WHERE p.user_id=$1 AND u.status='active'`,
      [profileUserId, req.userId, isConnected]
    );

    if (!result.rows.length) { res.status(404).json({ error: 'Profile not found' }); return; }
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Partner preferences ──────────────────────────────────────
router.get('/preferences/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`SELECT * FROM partner_preferences WHERE user_id=$1`, [req.userId]);
    res.json(result.rows[0] || {});
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/preferences/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    age_min, age_max, height_min_cm, height_max_cm, marital_status, religion, caste,
    mother_tongue, location_city, location_state, education_level, education_field,
    profession, income_min, income_max, lifestyle_diet, manglik, disability, requires_photo
  } = req.body;
  try {
    await pool.query(
      `UPDATE partner_preferences SET
        age_min=COALESCE($1,age_min), age_max=COALESCE($2,age_max),
        height_min_cm=COALESCE($3,height_min_cm), height_max_cm=COALESCE($4,height_max_cm),
        marital_status=COALESCE($5,marital_status), religion=COALESCE($6,religion),
        caste=COALESCE($7,caste), mother_tongue=COALESCE($8,mother_tongue),
        location_city=COALESCE($9,location_city), location_state=COALESCE($10,location_state),
        education_level=COALESCE($11,education_level), education_field=COALESCE($12,education_field),
        profession=COALESCE($13,profession), income_min=COALESCE($14,income_min),
        income_max=COALESCE($15,income_max), lifestyle_diet=COALESCE($16,lifestyle_diet),
        manglik=COALESCE($17,manglik), disability=COALESCE($18,disability),
        requires_photo=COALESCE($19,requires_photo), updated_at=NOW()
       WHERE user_id=$20`,
      [
        age_min, age_max, height_min_cm, height_max_cm, marital_status, religion, caste,
        mother_tongue, location_city, location_state, education_level, education_field,
        profession, income_min, income_max, lifestyle_diet, manglik, disability, requires_photo,
        req.userId
      ]
    );
    res.json({ message: 'Preferences updated' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
