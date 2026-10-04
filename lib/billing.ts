// Abo für Einzelpersonen: Konto vor der Zahlung vormerken, nach der Zahlung freischalten bzw. verlängern.
import bcrypt from "bcryptjs";
import { db, ready } from "./db";
import { normEmail } from "./users";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

const GRACE_DAYS = 3; // Puffer für die automatische Verlängerung und Wiederholungsversuche bei der Abbuchung

export type Signup = { userId: number };

/**
 * Konto für den Kauf bereitstellen. Neue Adressen werden als «vorgemerkt» (inaktiv) angelegt und erst nach der Zahlung
 * freigeschaltet. Bei bestehenden Konten wird nichts verändert – der Kauf verlängert nur die Gültigkeit.
 */
export async function prepareSignup(emailRaw: string, name: string, password: string): Promise<Signup> {
  const email = normEmail(emailRaw);
  const rows = await q(
    `SELECT id, active, pending, payrexx_subscription_id, (valid_until IS NULL OR valid_until >= CURRENT_DATE) AS valid FROM users WHERE email = $1`,
    [email]
  );
  const u = rows[0];
  if (u && !u.pending) {
    if (!u.active) throw new Error("Dieses Konto ist gesperrt. Bitte melde dich bei info@edutecsol.ch.");
    if (u.payrexx_subscription_id && u.valid) throw new Error("Für diese E-Mail-Adresse läuft bereits ein Abo. Melde dich an und verwalte es unter «Mein Bereich».");
    return { userId: Number(u.id) };
  }
  const hash = password ? await bcrypt.hash(password, 10) : null;
  if (u) {
    // vorgemerkt, aber nie bezahlt: Angaben überschreiben
    await q(`UPDATE users SET name = $2, password_hash = $3 WHERE id = $1`, [u.id, name || null, hash]);
    return { userId: Number(u.id) };
  }
  const ins = await q(
    `INSERT INTO users (email, name, role, active, pending, password_hash, notes) VALUES ($1,$2,'user',FALSE,TRUE,$3,'Abo (Payrexx)') RETURNING id`,
    [email, name || null, hash]
  );
  return { userId: Number(ins[0].id) };
}

/** Nach der ersten Zahlung: Konto freischalten und Gültigkeit setzen. Unbefristete Konten bleiben unbefristet. */
export async function activateSubscription(userId: number, subscriptionId: string, periodEnd: number) {
  await q(
    `UPDATE users SET payrexx_subscription_id = $2,
       valid_until = CASE WHEN NOT pending AND valid_until IS NULL THEN NULL
                          ELSE GREATEST(COALESCE(valid_until, CURRENT_DATE), to_timestamp($3)::date + ${GRACE_DAYS}) END,
       active = (active OR pending), pending = FALSE
     WHERE id = $1`,
    [userId, subscriptionId, periodEnd]
  );
}

/** Konto zu einem Payrexx-Abo (für Verlängerungen per Webhook). */
export async function userBySubscription(subscriptionId: string): Promise<{ id: number } | null> {
  const rows = await q(`SELECT id FROM users WHERE payrexx_subscription_id = $1`, [subscriptionId]);
  return rows[0] ? { id: Number(rows[0].id) } : null;
}

/** Abo beendet: Der Zugang läuft zum bereits gesetzten Datum aus. */
export async function clearSubscription(subscriptionId: string) {
  await q(`UPDATE users SET payrexx_subscription_id = NULL WHERE payrexx_subscription_id = $1`, [subscriptionId]);
}

export async function billingOf(userId: number): Promise<{ subscriptionId: string | null; validUntil: string | null }> {
  const rows = await q(
    `SELECT payrexx_subscription_id, to_char(valid_until, 'DD.MM.YYYY') AS valid_until FROM users WHERE id = $1`,
    [userId]
  );
  return { subscriptionId: (rows[0]?.payrexx_subscription_id as string) ?? null, validUntil: (rows[0]?.valid_until as string) ?? null };
}
