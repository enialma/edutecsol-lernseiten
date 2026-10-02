import bcrypt from "bcryptjs";
import { db, ready } from "./db";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  active: boolean;
  organisation: string | null;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
  last_login_at: string | null;
  last_login_via: string | null;
  has_password: boolean;
};

const COLS = `id, email, name, role, active, organisation, notes,
  to_char(valid_until, 'YYYY-MM-DD') AS valid_until,
  to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
  to_char(last_login_at, 'YYYY-MM-DD HH24:MI') AS last_login_at,
  last_login_via, (password_hash IS NOT NULL) AS has_password`;

export function normEmail(e: string) {
  return e.trim().toLowerCase();
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(normEmail)
    .filter(Boolean);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await q(`SELECT ${COLS} FROM users WHERE email = $1`, [normEmail(email)]);
  return (rows[0] as User) ?? null;
}

export async function listUsers(): Promise<User[]> {
  return (await q(`SELECT ${COLS} FROM users ORDER BY created_at DESC`)) as User[];
}

/** Zugang erlaubt? Benutzer muss existieren, aktiv sein und (falls gesetzt) noch gültig. */
export function isAllowed(u: User | null): u is User {
  if (!u || !u.active) return false;
  if (u.valid_until && u.valid_until < new Date().toISOString().slice(0, 10)) return false;
  return true;
}

/** Beim Login: Admins aus ADMIN_EMAILS automatisch anlegen, Login-Zeit vermerken. */
export async function touchLogin(email: string, name: string | null, via: string): Promise<User | null> {
  const e = normEmail(email);
  let u = await findUserByEmail(e);
  if (!u && adminEmails().includes(e)) {
    await q(
      `INSERT INTO users (email, name, role, active) VALUES ($1, $2, 'admin', TRUE)`,
      [e, name]
    );
    u = await findUserByEmail(e);
  }
  if (!isAllowed(u)) return null;
  await q(
    `UPDATE users SET last_login_at = NOW(), last_login_via = $2, name = COALESCE(name, $3) WHERE email = $1`,
    [e, via, name]
  );
  return u;
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const rows = await q(`SELECT password_hash FROM users WHERE email = $1`, [normEmail(email)]);
  const hash = rows[0]?.password_hash as string | undefined;
  if (!hash) return null;
  if (!(await bcrypt.compare(password, hash))) return null;
  return touchLogin(email, null, "password");
}

export async function createUser(input: {
  email: string; name?: string; role?: "user" | "admin"; organisation?: string;
  notes?: string; valid_until?: string; password?: string;
}) {
  const hash = input.password ? await bcrypt.hash(input.password, 10) : null;
  await q(
    `INSERT INTO users (email, name, role, organisation, notes, valid_until, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [normEmail(input.email), input.name || null, input.role ?? "user", input.organisation || null,
     input.notes || null, input.valid_until || null, hash]
  );
}

export async function setActive(id: number, active: boolean) {
  await q(`UPDATE users SET active = $2 WHERE id = $1`, [id, active]);
}

export async function setPassword(id: number, password: string) {
  const hash = await bcrypt.hash(password, 10);
  await q(`UPDATE users SET password_hash = $2 WHERE id = $1`, [id, hash]);
}

export async function deleteUser(id: number) {
  await q(`DELETE FROM users WHERE id = $1`, [id]);
}
