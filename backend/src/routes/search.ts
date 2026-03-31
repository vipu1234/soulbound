import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Search with 15 filters ───────────────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    age_min, age_max, height_min, height_max, marital_status,
    religion, caste, mother_tongue,
    location_city, location_state, location_country, hometown,
    education_level, education_field, profession,
    income_min, income_max, lifestyle_diet, lifestyle_smoke, lifestyle_drink,
    manglik, disability, requires_photo, gender,
    page = '1', limit = '20',
  } = req.query;

  try {
    const meResult = await pool.query(`SELECT gender FROM profiles WHERE user_id=?`, [req.userId]);
    const myGender = meResult.rows[0]?.gender;
    const oppositeGender = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null;

    const conditions: string[] = [
      `u.user_id != ?`,
      `u.status = 'active'`,
      `ps.is_hidden = 0`,
      `p.wizard_step >= 1`,
    ];
    const params: any[] = [req.userId];

    const addCond = (sql: string, val?: any) => { conditions.push(sql); if (val !== undefined) params.push(val); };

    // Filter 1: Age (SQLite: calculate age from dob string)
    if (age_min) addCond(`CAST((julianday('now') - julianday(p.dob)) / 365.25 AS INTEGER) >= ?`, Number(age_min));
    if (age_max) addCond(`CAST((julianday('now') - julianday(p.dob)) / 365.25 AS INTEGER) <= ?`, Number(age_max));

    // Filter 2: Height
    if (height_min) addCond(`p.height_cm >= ?`, Number(height_min));
    if (height_max) addCond(`p.height_cm <= ?`, Number(height_max));

    // Filter 3-6: Basic fields
    if (marital_status && marital_status !== 'any') addCond(`p.marital_status = ?`, marital_status);
    if (religion && religion !== 'any') addCond(`LOWER(p.religion) = LOWER(?)`, religion);
    if (caste && caste !== 'any') addCond(`LOWER(p.caste) = LOWER(?)`, caste);
    if (mother_tongue && mother_tongue !== 'any') addCond(`LOWER(p.mother_tongue) = LOWER(?)`, mother_tongue);

    // Filter 7: Location
    if (location_city && location_city !== 'any') addCond(`LOWER(p.current_city) LIKE LOWER(?)`, `%${location_city}%`);
    if (location_state && location_state !== 'any') addCond(`LOWER(p.current_state) LIKE LOWER(?)`, `%${location_state}%`);
    if (location_country && location_country !== 'any') addCond(`LOWER(p.current_country) = LOWER(?)`, location_country);

    // Filter 8: Hometown
    if (hometown && hometown !== 'any') addCond(`LOWER(p.hometown) LIKE LOWER(?)`, `%${hometown}%`);

    // Filter 9-10: Education
    if (education_level && education_level !== 'any') addCond(`LOWER(p.education_level) = LOWER(?)`, education_level);
    if (education_field && education_field !== 'any') addCond(`LOWER(p.education_field) LIKE LOWER(?)`, `%${education_field}%`);

    // Filter 11: Profession
    if (profession && profession !== 'any') addCond(`LOWER(p.occupation) LIKE LOWER(?)`, `%${profession}%`);

    // Filter 12: Income
    if (income_min) addCond(`p.annual_income >= ?`, Number(income_min));
    if (income_max) addCond(`p.annual_income <= ?`, Number(income_max));

    // Filter 13: Lifestyle
    if (lifestyle_diet && lifestyle_diet !== 'any') addCond(`p.lifestyle_diet = ?`, lifestyle_diet);
    if (lifestyle_smoke && lifestyle_smoke !== 'any') addCond(`p.lifestyle_smoke = ?`, lifestyle_smoke);
    if (lifestyle_drink && lifestyle_drink !== 'any') addCond(`p.lifestyle_drink = ?`, lifestyle_drink);

    // Filter 14-15: Manglik & Disability
    if (manglik && manglik !== 'any') addCond(`p.manglik = ?`, manglik);
    if (disability && disability !== 'any') addCond(`p.disability = ?`, disability);

    // Photo availability
    if (requires_photo === 'true') addCond(`p.photo_url IS NOT NULL`);

    // Gender
    const targetGender = gender || oppositeGender;
    if (targetGender) addCond(`p.gender = ?`, targetGender);

    const offset = (Number(page) - 1) * Number(limit);
    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM profiles p
       JOIN users u ON u.user_id = p.user_id
       JOIN privacy_settings ps ON ps.user_id = p.user_id
       WHERE ${whereClause}`, params
    );
    const total = Number(countResult.rows[0]?.count || 0);

    const result = await pool.query(
      `SELECT p.user_id, p.full_name, p.dob, p.gender, p.religion, p.caste, p.mother_tongue,
              p.height_cm, p.annual_income, p.occupation, p.education_level, p.current_city,
              p.current_state, p.marital_status, p.manglik, p.disability,
              u.is_verified, u.trust_score,
              CASE WHEN ps.photo_visibility = 'public' THEN p.photo_url
                   WHEN ps.photo_visibility = 'registered_only' THEN p.photo_url
                   ELSE NULL END AS photo_url
       FROM profiles p
       JOIN users u ON u.user_id = p.user_id
       JOIN privacy_settings ps ON ps.user_id = p.user_id
       WHERE ${whereClause}
       ORDER BY u.trust_score DESC, p.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    res.json({ profiles: result.rows, total, page: Number(page), limit: Number(limit) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Daily Matches ────────────────────────────────────────────
router.get('/daily-matches', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prefResult = await pool.query(`SELECT * FROM partner_preferences WHERE user_id=?`, [req.userId]);
    const myProfile = await pool.query(`SELECT gender FROM profiles WHERE user_id=?`, [req.userId]);
    const prefs = prefResult.rows[0] || {};
    const myGender = myProfile.rows[0]?.gender;
    const oppositeGender = myGender === 'male' ? 'female' : 'male';

    const result = await pool.query(
      `SELECT p.user_id, p.full_name, p.dob, p.gender, p.religion, p.mother_tongue,
              p.height_cm, p.annual_income, p.occupation, p.education_level,
              p.current_city, p.current_state, p.about_me, p.marital_status,
              u.is_verified, u.trust_score,
              CASE WHEN ps.photo_visibility != 'accepted_only' THEN p.photo_url ELSE NULL END AS photo_url
       FROM profiles p
       JOIN users u ON u.user_id = p.user_id
       JOIN privacy_settings ps ON ps.user_id = p.user_id
       WHERE u.user_id != ?
         AND u.status = 'active'
         AND ps.is_hidden = 0
         AND p.wizard_step >= 1
         AND p.gender = ?
         AND CAST((julianday('now') - julianday(p.dob)) / 365.25 AS INTEGER) BETWEEN ? AND ?
       ORDER BY RANDOM()
       LIMIT 10`,
      [req.userId, oppositeGender, prefs.age_min || 18, prefs.age_max || 45]
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
