import { createHash, randomBytes } from "node:crypto";
import { db, ready } from "./db";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

export type PageMeta = {
  id: number;
  user_id: number;
  title: string;
  fach: string | null;
  stufe: string | null;
  thema: string | null;
  params: Record<string, unknown>;
  material_name: string | null;
  provider: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number | null;
  notiz: string | null;
  created_at: string;
  html_bytes: number;
  share_token: string | null;
  pool: boolean;
  school: boolean;
  copied_from: number | null;
  owner_email: string;
  owner_name: string | null;
  owner_institution: string | null;
  /** KI-Lerncoach: pro Seite eingeschaltet, Stil, Anbieter; owner_coach = Zusatzoption der Lehrperson */
  coach: boolean;
  coach_stil: string;
  coach_provider: string;
  owner_coach: boolean;
  /** Institution der Autorin im Schulmodus «KI nur Schweiz» (Coach nur Infomaniak) */
  owner_swiss_only: boolean;
  /** Lösungen über den Freigabelink sichtbar; loesung_version = erzeugt ab 2.10.2026 (Schalter verfügbar, siehe lib/loesung.ts) */
  loesung_offen: boolean;
  loesung_version: boolean;
};
export type PageFull = PageMeta & { html: string };

const META = `p.id, p.user_id, p.title, p.fach, p.stufe, p.thema, p.params, p.material_name, p.provider, p.model,
  p.input_tokens, p.output_tokens, p.duration_ms, p.notiz, p.share_token, p.pool, p.school, p.copied_from,
  p.coach, p.coach_stil, p.coach_provider, u.coach AS owner_coach,
  p.loesung_offen, p.created_at >= TIMESTAMPTZ '2026-10-02 00:00 Europe/Zurich' AS loesung_version,
  to_char(p.created_at, 'DD.MM.YYYY HH24:MI') AS created_at, length(p.html) AS html_bytes,
  u.email AS owner_email, u.name AS owner_name, i.name AS owner_institution, COALESCE(i.swiss_only, FALSE) AS owner_swiss_only`;

/** Coach-Einstellungen einer Seite (nur Besitzerin oder Admin). */
export async function setCoach(id: number, userId: number, isAdmin: boolean, s: { on: boolean; stil: string; provider: string }): Promise<number> {
  const rows = await q(`UPDATE pages SET coach = $4, coach_stil = $5, coach_provider = $6 WHERE id = $1 AND ($2::boolean OR user_id = $3) RETURNING id, coach`,
    [id, isAdmin, userId, s.on, s.stil, s.provider]);
  return rows.length;
}
/** Lösungen über den Freigabelink zeigen oder ausblenden (nur Besitzerin oder Admin). */
export async function setLoesung(id: number, userId: number, isAdmin: boolean, on: boolean) {
  await q(`UPDATE pages p SET loesung_offen = $3 WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, on]);
}
const FROM = `FROM pages p JOIN users u ON u.id = p.user_id LEFT JOIN institutions i ON i.id = u.institution_id`;
// Für die eigene Schule freigegeben: Autorin und betrachtende Person gehören zur selben Institution ($n = userId)
const sameSchool = (n: number) => `(p.school = TRUE AND u.institution_id IS NOT NULL AND u.institution_id = (SELECT institution_id FROM users WHERE id = $${n}))`;

export async function createPage(input: {
  userId: number; title: string; fach?: string; stufe?: string; thema?: string; params: unknown;
  materialName?: string | null; provider: string; model?: string; inputTokens: number; outputTokens: number;
  durationMs: number; html: string; notiz?: string | null; copiedFrom?: number | null;
}): Promise<number> {
  const rows = await q(
    `INSERT INTO pages (user_id, title, fach, stufe, thema, params, material_name, provider, model, input_tokens, output_tokens, duration_ms, html, notiz, copied_from)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [input.userId, input.title, input.fach || null, input.stufe || null, input.thema || null, JSON.stringify(input.params),
     input.materialName ?? null, input.provider, input.model ?? null, input.inputTokens, input.outputTokens, input.durationMs,
     input.html, input.notiz ?? null, input.copiedFrom ?? null]
  );
  return Number(rows[0].id);
}

export type ListMode = "mine" | "school" | "pool" | "all";
/** gruppe: nur Seiten dieser Gruppe; ohneGruppe: Seiten, die in keiner eigenen Gruppe liegen */
export type ListFilter = { fach?: string; stufe?: string; q?: string; gruppe?: number; ohneGruppe?: boolean };

export async function listPages(userId: number, mode: ListMode, f: ListFilter = {}): Promise<PageMeta[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace("?", `$${params.length}`)); };
  if (mode === "mine") add("p.user_id = ?", userId);
  if (mode === "school") { params.push(userId); where.push(sameSchool(params.length)); }
  if (mode === "pool") where.push("p.pool = TRUE");
  if (f.gruppe) add("EXISTS (SELECT 1 FROM lerngruppe_seiten ls WHERE ls.page_id = p.id AND ls.group_id = ?)", f.gruppe);
  if (f.ohneGruppe) add("NOT EXISTS (SELECT 1 FROM lerngruppe_seiten ls JOIN lerngruppen g ON g.id = ls.group_id WHERE ls.page_id = p.id AND g.user_id = ?)", userId);
  if (f.fach) add("p.fach = ?", f.fach);
  if (f.stufe) add("p.stufe = ?", f.stufe);
  if (f.q) add("(p.title ILIKE ? OR p.thema ILIKE $" + (params.length + 1) + ")", `%${f.q}%`);
  const sql = `SELECT ${META} ${FROM} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY p.created_at DESC`;
  return (await q(sql, params)) as PageMeta[];
}

/** Werte für Filter-Dropdowns (eigene + Pool). */
export async function filterValues(userId: number, mode: ListMode): Promise<{ fach: string[]; stufe: string[] }> {
  const cond = mode === "mine" ? "p.user_id = $1" : mode === "school" ? sameSchool(1) : mode === "pool" ? "p.pool = TRUE AND $1::int IS NOT NULL" : "$1::int IS NOT NULL";
  const rows = await q(`SELECT DISTINCT p.fach, p.stufe FROM pages p JOIN users u ON u.id = p.user_id WHERE ${cond}`, [userId]);
  const fach = [...new Set(rows.map((r) => r.fach as string).filter(Boolean))].sort();
  const stufe = [...new Set(rows.map((r) => r.stufe as string).filter(Boolean))].sort();
  return { fach, stufe };
}

/** Zugriff: eigene Seite, Admin, Pool-Seite oder für die eigene Schule freigegeben. */
export async function getPage(id: number, userId: number, isAdmin: boolean): Promise<PageFull | null> {
  const rows = await q(
    `SELECT ${META}, p.html ${FROM} WHERE p.id = $1 AND ($2 OR p.user_id = $3 OR p.pool = TRUE OR ${sameSchool(3)})`,
    [id, isAdmin, userId]
  );
  return (rows[0] as PageFull) ?? null;
}

export async function getPageByToken(token: string): Promise<PageFull | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await q(`SELECT ${META}, p.html ${FROM} WHERE p.share_token = $1`, [token]);
  return (rows[0] as PageFull) ?? null;
}

// $2 muss in jedem Fall referenziert werden, sonst meldet Postgres «could not determine data type of parameter».
function canEdit(isAdmin: boolean) {
  return isAdmin ? "$2::int IS NOT NULL" : "p.user_id = $2";
}

export async function setShare(id: number, userId: number, isAdmin: boolean, on: boolean): Promise<string | null> {
  const token = on ? randomBytes(18).toString("base64url") : null;
  await q(`UPDATE pages p SET share_token = $3 WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, token]);
  return token;
}

export async function setPool(id: number, userId: number, isAdmin: boolean, on: boolean) {
  await q(`UPDATE pages p SET pool = $3 WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, on]);
}

export async function updateTitle(id: number, userId: number, isAdmin: boolean, title: string) {
  await q(`UPDATE pages p SET title = $3 WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, title]);
}

export type Visibility = "private" | "school" | "all";

/** Sichtbarkeit für Kolleginnen und Kollegen: nur ich, eigene Schule oder alle (Pool). */
export async function setVisibility(id: number, userId: number, isAdmin: boolean, v: Visibility) {
  await q(`UPDATE pages p SET pool = $3, school = $4 WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, v === "all", v === "school"]);
}

/** Freigegebene Seite (Schule oder Pool) in die eigene Sammlung kopieren. */
export async function duplicatePage(id: number, userId: number, isAdmin: boolean): Promise<number | null> {
  const src = await getPage(id, userId, isAdmin);
  if (!src) return null;
  return createPage({
    userId, title: src.title, fach: src.fach ?? undefined, stufe: src.stufe ?? undefined, thema: src.thema ?? undefined,
    params: src.params, materialName: src.material_name, provider: src.provider, model: src.model ?? undefined,
    inputTokens: 0, outputTokens: 0, durationMs: 0, html: src.html, notiz: src.notiz, copiedFrom: src.id,
  });
}

// ---------- Nachbessern: alle Fassungen aufbewahren, jede lässt sich wieder aktivieren ----------

const MAX_FASSUNGEN = 20; // dazu immer die Fassung vor dem ersten Nachbessern und die aktive
const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");

/**
 * Speichert eine nachgebesserte Fassung und macht sie aktiv, sofern die Seite seit dem Lesen unverändert ist.
 * Beim ersten Nachbessern wird zuerst die bisherige Seite als Ausgangsfassung (auftrag '') abgelegt, mit dem Erstelldatum der Seite.
 */
export async function saveNachbesserung(v: { id: number; altHtml: string; neuHtml: string; auftrag: string; provider: string; model: string; inputTokens: number; outputTokens: number; limit: number | null }): Promise<boolean> {
  // limit: höchstens so viele Nachbesserungen pro Seite (null = ohne Grenze); hier nochmals geprüft, falls zwei gleichzeitig laufen
  const rows = await q(
    `WITH alt AS (SELECT id, html, provider, model, created_at FROM pages WHERE id = $1 AND md5(html) = $2
                    AND ($9::int IS NULL OR (SELECT COUNT(*) FROM page_fassungen WHERE page_id = $1 AND auftrag <> '') < $9) FOR UPDATE),
     start AS (INSERT INTO page_fassungen (page_id, html, auftrag, provider, model, created_at)
               SELECT id, html, '', provider, model, created_at FROM alt
               WHERE NOT EXISTS (SELECT 1 FROM page_fassungen WHERE page_id = $1)),
     neu AS (INSERT INTO page_fassungen (page_id, html, auftrag, provider, model, input_tokens, output_tokens)
             SELECT id, $3, $4, $5, $6, $7, $8 FROM alt RETURNING id)
     UPDATE pages p SET html = $3, fassung_id = (SELECT id FROM neu) FROM alt WHERE p.id = alt.id RETURNING p.id`,
    [v.id, md5(v.altHtml), v.neuHtml, v.auftrag, v.provider, v.model, v.inputTokens, v.outputTokens, v.limit]
  );
  if (!rows.length) return false;
  await q(
    `DELETE FROM page_fassungen f WHERE f.page_id = $1 AND f.auftrag <> ''
       AND f.id <> COALESCE((SELECT fassung_id FROM pages WHERE id = $1), 0)
       AND f.id NOT IN (SELECT id FROM page_fassungen WHERE page_id = $1 ORDER BY created_at DESC, id DESC LIMIT ${MAX_FASSUNGEN})`,
    [v.id]
  );
  return true;
}

/** Bisherige gelungene Nachbesserungen einer Seite (ohne die Fassung vor dem ersten Nachbessern). */
export async function anzahlNachbesserungen(pageId: number): Promise<number> {
  const rows = await q(`SELECT COUNT(*)::int AS n FROM page_fassungen WHERE page_id = $1 AND auftrag <> ''`, [pageId]);
  return Number(rows[0]?.n ?? 0);
}

export type Fassung = { id: number; auftrag: string; created_at: string; aktiv: boolean };

/** Alle Fassungen einer Seite, neueste zuerst; leer, solange die Seite nie nachgebessert wurde. */
export async function listFassungen(pageId: number): Promise<Fassung[]> {
  return (await q(
    `SELECT f.id, f.auftrag, to_char(f.created_at AT TIME ZONE 'Europe/Zurich', 'DD.MM.YYYY HH24:MI') AS created_at, (f.id = p.fassung_id) AS aktiv
     FROM page_fassungen f JOIN pages p ON p.id = f.page_id WHERE f.page_id = $1 ORDER BY f.created_at DESC, f.id DESC`,
    [pageId]
  )) as Fassung[];
}

/** HTML einer Fassung (Ansicht für die Lehrperson). */
export async function getFassungHtml(pageId: number, fassungId: number): Promise<string | null> {
  const rows = await q(`SELECT html FROM page_fassungen WHERE id = $2 AND page_id = $1`, [pageId, fassungId]);
  return (rows[0]?.html as string) ?? null;
}

/** Macht eine ältere oder neuere Fassung wieder zur aktiven Seite; nichts wird gelöscht (nur Besitzerin oder Admin). */
export async function setFassung(id: number, userId: number, isAdmin: boolean, fassungId: number): Promise<boolean> {
  const rows = await q(
    `UPDATE pages p SET html = f.html, fassung_id = f.id FROM page_fassungen f
     WHERE p.id = $1 AND f.id = $3 AND f.page_id = p.id AND (${canEdit(isAdmin)}) RETURNING p.id`,
    [id, userId, fassungId]
  );
  return rows.length > 0;
}

export async function deletePage(id: number, userId: number, isAdmin: boolean) {
  await q(`DELETE FROM pages p WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId]);
}

/** Dateinamen der bereits übernommenen Beispielseiten (provider 'beispiel'). */
export async function importedBeispiele(): Promise<string[]> {
  const rows = await q(`SELECT material_name FROM pages WHERE provider = 'beispiel' AND copied_from IS NULL`);
  return rows.map((r) => r.material_name as string);
}
