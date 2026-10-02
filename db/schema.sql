CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  organisation  TEXT,
  notes         TEXT,
  valid_until   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_login_via TEXT
);
