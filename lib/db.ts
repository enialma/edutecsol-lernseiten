import { neon } from "@neondatabase/serverless";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt.");
  return neon(url);
}

// Tabellen beim ersten Zugriff anlegen (idempotent), damit kein manueller Migrationsschritt nötig ist.
const SCHEMA = `CREATE TABLE IF NOT EXISTS users (
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
)`;

const SCHEMA_PAGES = `CREATE TABLE IF NOT EXISTS pages (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  fach          TEXT,
  stufe         TEXT,
  thema         TEXT,
  params        JSONB NOT NULL DEFAULT '{}'::jsonb,
  material_name TEXT,
  provider      TEXT NOT NULL,
  model         TEXT,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER,
  html          TEXT NOT NULL,
  notiz         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

let readyPromise: Promise<void> | null = null;
export function ready(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const sql = db();
      await sql.query(SCHEMA);
      await sql.query(SCHEMA_PAGES);
    })().catch((e) => {
      readyPromise = null;
      throw e;
    });
  }
  return readyPromise;
}
