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
      await sql.query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE`);
      await sql.query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS pool BOOLEAN NOT NULL DEFAULT FALSE`);
      await sql.query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS copied_from INTEGER`);
      // Institutionen: Lernseiten lassen sich nur für die eigene Schule freigeben (pages.school)
      await sql.query(`CREATE TABLE IF NOT EXISTS institutions (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL`);
      await sql.query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS school BOOLEAN NOT NULL DEFAULT FALSE`);
      // Einmalig: bisherige Freitext-Einträge «Schule / Organisation» als Institutionen übernehmen
      const has = await sql.query(`SELECT 1 FROM institutions LIMIT 1`);
      if (has.length === 0) {
        await sql.query(`INSERT INTO institutions (name) SELECT DISTINCT btrim(organisation) FROM users WHERE btrim(COALESCE(organisation,'')) <> '' ON CONFLICT DO NOTHING`);
        await sql.query(`UPDATE users u SET institution_id = i.id FROM institutions i WHERE u.institution_id IS NULL AND btrim(u.organisation) = i.name`);
      }
      // Abo für Einzelpersonen (Stripe): vorgemerkte Konten sind bis zur ersten Zahlung inaktiv
      await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending BOOLEAN NOT NULL DEFAULT FALSE`);
      await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`);
      await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`);
      // Protokoll der KI-Erzeugungen für Kontingent und Nutzung; einmalig aus den bestehenden Seiten befüllt
      await sql.query(`CREATE TABLE IF NOT EXISTS generations (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider      TEXT NOT NULL,
        model         TEXT,
        input_tokens  INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        ok            BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query(`INSERT INTO generations (user_id, provider, model, input_tokens, output_tokens, created_at)
        SELECT user_id, provider, model, input_tokens, output_tokens, created_at FROM pages
        WHERE copied_from IS NULL AND provider <> 'beispiel' AND NOT EXISTS (SELECT 1 FROM generations)`);
      await sql.query(`CREATE TABLE IF NOT EXISTS moodle_links (
        user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        base_url   TEXT NOT NULL,
        token_enc  TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    })().catch((e) => {
      readyPromise = null;
      throw e;
    });
  }
  return readyPromise;
}
