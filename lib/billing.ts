// Abo für Einzelpersonen: Konto vor der Zahlung vormerken, nach der Zahlung freischalten bzw. verlängern.
import bcrypt from "bcryptjs";
import { db, ready } from "./db";
import { normEmail } from "./users";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

const GRACE_DAYS = 3; // Puffer für die automatische Verlängerung und Wiederholungsversuche bei der Abbuchung

export type Signup = { userId: number; customerId: string | null };

/**
 * Konto für den Kauf bereitstellen. Neue Adressen werden als «vorgemerkt» (inaktiv) angelegt und erst nach der Zahlung
 * freigeschaltet. Bei bestehenden Konten wird nichts verändert – der Kauf verlängert nur die Gültigkeit.
 */
export async function prepareSignup(emailRaw: string, name: string, password: string): Promise<Signup> {
  const email = normEmail(emailRaw);
  const rows = await q(
    `SELECT id, active, pending, stripe_customer_id, stripe_subscription_id, (valid_until IS NULL OR valid_until >= CURRENT_DATE) AS valid FROM users WHERE email = $1`,
    [email]
  );
  const u = rows[0];
  if (u && !u.pending) {
    if (!u.active) throw new Error("Dieses Konto ist gesperrt. Bitte melde dich bei info@edutecsol.ch.");
    if (u.stripe_subscription_id && u.valid) throw new Error("Für diese E-Mail-Adresse läuft bereits ein Abo. Melde dich an und verwalte es unter «Mein Bereich».");
    return { userId: Number(u.id), customerId: (u.stripe_customer_id as string) ?? null };
  }
  const hash = password ? await bcrypt.hash(password, 10) : null;
  if (u) {
    // vorgemerkt, aber nie bezahlt: Angaben überschreiben
    await q(`UPDATE users SET name = $2, password_hash = $3 WHERE id = $1`, [u.id, name || null, hash]);
    return { userId: Number(u.id), customerId: null };
  }
  const ins = await q(
    `INSERT INTO users (email, name, role, active, pending, password_hash, notes) VALUES ($1,$2,'user',FALSE,TRUE,$3,'Abo (Stripe)') RETURNING id`,
    [email, name || null, hash]
  );
  return { userId: Number(ins[0].id), customerId: null };
}

/** Nach der ersten Zahlung: Konto freischalten und Gültigkeit setzen. Unbefristete Konten bleiben unbefristet. */
export async function activateSubscription(userId: number, customerId: string, subscriptionId: string, periodEnd: number) {
  await q(
    `UPDATE users SET stripe_customer_id = $2, stripe_subscription_id = $3,
       valid_until = CASE WHEN NOT pending AND valid_until IS NULL THEN NULL
                          ELSE GREATEST(COALESCE(valid_until, CURRENT_DATE), to_timestamp($4)::date + ${GRACE_DAYS}) END,
       active = (active OR pending), pending = FALSE
     WHERE id = $1`,
    [userId, customerId, subscriptionId, periodEnd]
  );
}

/** Abo-Daten zu einem Stripe-Kunden (für Verlängerungen per Webhook). */
export async function userByCustomer(customerId: string): Promise<{ id: number; subscriptionId: string | null } | null> {
  const rows = await q(`SELECT id, stripe_subscription_id FROM users WHERE stripe_customer_id = $1`, [customerId]);
  return rows[0] ? { id: Number(rows[0].id), subscriptionId: (rows[0].stripe_subscription_id as string) ?? null } : null;
}

/** Abo beendet: Der Zugang läuft zum bereits gesetzten Datum aus. */
export async function clearSubscription(subscriptionId: string) {
  await q(`UPDATE users SET stripe_subscription_id = NULL WHERE stripe_subscription_id = $1`, [subscriptionId]);
}

export async function billingOf(userId: number): Promise<{ customerId: string | null; hasSubscription: boolean; validUntil: string | null }> {
  const rows = await q(
    `SELECT stripe_customer_id, stripe_subscription_id, to_char(valid_until, 'DD.MM.YYYY') AS valid_until FROM users WHERE id = $1`,
    [userId]
  );
  return { customerId: (rows[0]?.stripe_customer_id as string) ?? null, hasSubscription: !!rows[0]?.stripe_subscription_id, validUntil: (rows[0]?.valid_until as string) ?? null };
}
