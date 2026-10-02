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

let readyPromise: Promise<void> | null = null;
export function ready(): Promise<void> {
  if (!readyPromise) {
    readyPromise = db().query(SCHEMA).then(() => undefined).catch((e) => {
      readyPromise = null;
      throw e;
    });
  }
  return readyPromise;
}
