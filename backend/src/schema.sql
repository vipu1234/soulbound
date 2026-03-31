-- SoulBound — SQLite Schema
-- All tables use IF NOT EXISTS for idempotent init

CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone_encrypted TEXT,
  is_verified   INTEGER DEFAULT 0,
  trust_score   INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'active' CHECK(status IN ('active','paused','deleted','suspended')),
  otp           TEXT,
  otp_expires   TEXT,
  refresh_token TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  profile_id    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id       TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  full_name     TEXT,
  dob           TEXT,
  gender        TEXT DEFAULT 'male',
  marital_status TEXT DEFAULT 'never_married',
  height_cm     INTEGER,
  weight_kg     INTEGER,
  blood_group   TEXT,
  about_me      TEXT,
  current_city  TEXT,
  current_state TEXT,
  current_country TEXT DEFAULT 'India',
  hometown      TEXT,
  religion      TEXT,
  caste         TEXT,
  mother_tongue TEXT,
  occupation    TEXT,
  company       TEXT,
  education_level TEXT DEFAULT 'bachelors',
  education_field TEXT,
  annual_income REAL,
  lifestyle_diet   TEXT DEFAULT 'vegetarian',
  lifestyle_smoke  TEXT DEFAULT 'no',
  lifestyle_drink  TEXT DEFAULT 'no',
  manglik       TEXT DEFAULT 'dont_know',
  disability    TEXT DEFAULT 'none',
  horoscope_data TEXT DEFAULT '{}',
  photo_url     TEXT,
  govt_id_encrypted TEXT,
  wizard_step   INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  privacy_id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id            TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  photo_visibility   TEXT DEFAULT 'registered_only',
  contact_visibility TEXT DEFAULT 'accepted_only',
  show_online_status INTEGER DEFAULT 1,
  is_hidden          INTEGER DEFAULT 0,
  created_at         TEXT DEFAULT (datetime('now')),
  updated_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_preferences (
  pref_id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id        TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  age_min        INTEGER DEFAULT 21,
  age_max        INTEGER DEFAULT 35,
  height_min_cm  INTEGER,
  height_max_cm  INTEGER,
  marital_status TEXT,
  religion       TEXT,
  caste          TEXT,
  mother_tongue  TEXT,
  location_city  TEXT,
  location_state TEXT,
  education_level TEXT,
  education_field TEXT,
  profession     TEXT,
  income_min     REAL,
  income_max     REAL,
  lifestyle_diet TEXT,
  manglik        TEXT,
  disability     TEXT,
  requires_photo INTEGER DEFAULT 0,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interests (
  interest_id   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sender_id     TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id   TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  message_id    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sender_id     TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id   TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_read       INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  report_id     TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reporter_id   TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reported_id   TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  description   TEXT,
  status        TEXT DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')),
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_sender ON interests(sender_id);
CREATE INDEX IF NOT EXISTS idx_interests_receiver ON interests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
