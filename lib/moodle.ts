// Moodle-Direktanbindung: Lernseite als Link/URL-Aktivität in einen Kurs legen.
// Braucht auf dem Moodle das Plugin local_aicoursecreator (Dienst «Claude MCP Service») und einen persönlichen Token.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { db, ready } from "./db";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

// ---------- Token-Verschlüsselung (AES-256-GCM, Schlüssel aus AUTH_SECRET) ----------
function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET ist nicht gesetzt.");
  return createHash("sha256").update("moodle-token:" + secret).digest();
}

function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64url");
}

function decrypt(enc: string) {
  const b = Buffer.from(enc, "base64url");
  const d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}

// ---------- Adresse ----------
/** Aus einer beliebigen Moodle-Adresse (Startseite, Kurslink …) die Basis-URL machen. Nur https, keine internen Hosts. */
export function normalizeBase(input: string): string {
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : "https://" + input.trim()); } catch { throw new Error("Das ist keine gültige Moodle-Adresse."); }
  if (u.protocol !== "https:") throw new Error("Die Moodle-Adresse muss mit https:// beginnen.");
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") || /(^|\.)(localhost|local|internal)$/.test(host)) throw new Error("Diese Moodle-Adresse ist nicht erlaubt.");
  const path = u.pathname.replace(/\/(course|my|login|mod|admin|webservice|user|index\.php)(\/.*|$)/, "").replace(/\/+$/, "");
  return u.origin + path;
}

/** Kurs-ID aus «30» oder aus einem Kurslink …/course/view.php?id=30. */
export function parseCourseId(input: string): number {
  const s = input.trim();
  if (/^\d+$/.test(s)) return Number(s);
  try {
    const id = new URL(s).searchParams.get("id");
    if (id && /^\d+$/.test(id)) return Number(id);
  } catch { /* unten */ }
  throw new Error("Bitte die Kurs-ID oder den Link zum Kurs angeben (…/course/view.php?id=…).");
}

// ---------- Verbindung pro Person ----------
export async function saveMoodleLink(userId: number, base: string, token: string) {
  await q(
    `INSERT INTO moodle_links (user_id, base_url, token_enc) VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET base_url = $2, token_enc = $3, updated_at = NOW()`,
    [userId, base, encrypt(token)]
  );
}

export async function deleteMoodleLink(userId: number) {
  await q(`DELETE FROM moodle_links WHERE user_id = $1`, [userId]);
}

export async function getMoodleBase(userId: number): Promise<string | null> {
  const rows = await q(`SELECT base_url FROM moodle_links WHERE user_id = $1`, [userId]);
  return (rows[0]?.base_url as string) ?? null;
}

async function getLink(userId: number): Promise<{ base: string; token: string }> {
  const rows = await q(`SELECT base_url, token_enc FROM moodle_links WHERE user_id = $1`, [userId]);
  if (!rows[0]) throw new Error("Noch keine Moodle-Verbindung eingerichtet.");
  return { base: rows[0].base_url as string, token: decrypt(rows[0].token_enc as string) };
}

// ---------- Webservice ----------
async function call(base: string, token: string, wsfunction: string, params: Record<string, string | number>) {
  const body = new URLSearchParams({ wstoken: token, wsfunction, moodlewsrestformat: "json" });
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));
  let res: Response;
  try {
    res = await fetch(`${base}/webservice/rest/server.php`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
      redirect: "error", signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("Moodle ist unter dieser Adresse nicht erreichbar.");
  }
  let data: unknown;
  try { data = await res.json(); } catch { throw new Error("Moodle antwortet nicht wie erwartet. Sind Webservices und das REST-Protokoll aktiviert?"); }
  const err = data as { exception?: string; errorcode?: string; message?: string } | null;
  if (err && err.exception) {
    if (err.errorcode === "invalidtoken") throw new Error("Der Token ist ungültig oder abgelaufen.");
    if (/accessexception|servicenotavailable/.test(err.errorcode ?? "")) throw new Error("Der Token darf diese Funktion nicht nutzen. Er muss zum Dienst «Claude MCP Service» gehören.");
    if (err.errorcode === "invalidrecord" || /dml_missing_record/.test(err.exception)) throw new Error("Diesen Kurs gibt es nicht.");
    if (/required_capability|nopermissions/.test((err.exception ?? "") + (err.errorcode ?? ""))) throw new Error("Du hast in diesem Kurs keine Bearbeitungsrechte.");
    throw new Error(`Moodle meldet: ${err.message ?? err.errorcode}`);
  }
  return data;
}

export type MoodleSection = { sectionnum: number; name: string };

export async function moodleSections(userId: number, courseId: number): Promise<MoodleSection[]> {
  const { base, token } = await getLink(userId);
  const rows = (await call(base, token, "local_aicoursecreator_get_sections", { courseid: courseId })) as { sectionnum: number; name?: string }[];
  // Moodle liefert Namen HTML-kodiert (&amp; …)
  const plain = (n: string) => n.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  return rows.map((s) => ({ sectionnum: s.sectionnum, name: s.name ? plain(s.name) : s.sectionnum === 0 ? "Allgemeines" : `Abschnitt ${s.sectionnum}` }));
}

/** Legt die Link/URL-Aktivität an und gibt den Link zum Kurs zurück. */
export async function moodleCreateUrl(userId: number, a: { courseId: number; sectionnum: number; name: string; url: string; intro: string }): Promise<string> {
  const { base, token } = await getLink(userId);
  await call(base, token, "local_aicoursecreator_create_url", {
    courseid: a.courseId, sectionnum: a.sectionnum, name: a.name, externalurl: a.url, intro: a.intro, visible: 1,
  });
  return `${base}/course/view.php?id=${a.courseId}`;
}
