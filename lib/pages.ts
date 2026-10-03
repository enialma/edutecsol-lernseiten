import { randomBytes } from "node:crypto";
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
  copied_from: number | null;
  owner_email: string;
  owner_name: string | null;
};
export type PageFull = PageMeta & { html: string };

const META = `p.id, p.user_id, p.title, p.fach, p.stufe, p.thema, p.params, p.material_name, p.provider, p.model,
  p.input_tokens, p.output_tokens, p.duration_ms, p.notiz, p.share_token, p.pool, p.copied_from,
  to_char(p.created_at, 'DD.MM.YYYY HH24:MI') AS created_at, length(p.html) AS html_bytes,
  u.email AS owner_email, u.name AS owner_name`;
const FROM = `FROM pages p JOIN users u ON u.id = p.user_id`;

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

export type ListMode = "mine" | "pool" | "all";
export type ListFilter = { fach?: string; stufe?: string; q?: string };

export async function listPages(userId: number, mode: ListMode, f: ListFilter = {}): Promise<PageMeta[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace("?", `$${params.length}`)); };
  if (mode === "mine") add("p.user_id = ?", userId);
  if (mode === "pool") where.push("p.pool = TRUE");
  if (f.fach) add("p.fach = ?", f.fach);
  if (f.stufe) add("p.stufe = ?", f.stufe);
  if (f.q) add("(p.title ILIKE ? OR p.thema ILIKE $" + (params.length + 1) + ")", `%${f.q}%`);
  const sql = `SELECT ${META} ${FROM} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY p.created_at DESC`;
  return (await q(sql, params)) as PageMeta[];
}

/** Werte für Filter-Dropdowns (eigene + Pool). */
export async function filterValues(userId: number, mode: ListMode): Promise<{ fach: string[]; stufe: string[] }> {
  const cond = mode === "mine" ? "p.user_id = $1" : mode === "pool" ? "p.pool = TRUE AND $1 = $1" : "$1 = $1";
  const rows = await q(`SELECT DISTINCT p.fach, p.stufe FROM pages p WHERE ${cond}`, [userId]);
  const fach = [...new Set(rows.map((r) => r.fach as string).filter(Boolean))].sort();
  const stufe = [...new Set(rows.map((r) => r.stufe as string).filter(Boolean))].sort();
  return { fach, stufe };
}

/** Zugriff: eigene Seite, Admin oder Pool-Seite. */
export async function getPage(id: number, userId: number, isAdmin: boolean): Promise<PageFull | null> {
  const rows = await q(
    `SELECT ${META}, p.html ${FROM} WHERE p.id = $1 AND ($2 OR p.user_id = $3 OR p.pool = TRUE)`,
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

/** Pool-Seite in die eigene Sammlung kopieren. */
export async function duplicatePage(id: number, userId: number, isAdmin: boolean): Promise<number | null> {
  const src = await getPage(id, userId, isAdmin);
  if (!src) return null;
  return createPage({
    userId, title: src.title, fach: src.fach ?? undefined, stufe: src.stufe ?? undefined, thema: src.thema ?? undefined,
    params: src.params, materialName: src.material_name, provider: src.provider, model: src.model ?? undefined,
    inputTokens: 0, outputTokens: 0, durationMs: 0, html: src.html, notiz: src.notiz, copiedFrom: src.id,
  });
}

export async function deletePage(id: number, userId: number, isAdmin: boolean) {
  await q(`DELETE FROM pages p WHERE p.id = $1 AND (${canEdit(isAdmin)})`, [id, userId]);
}

/** Dateinamen der bereits übernommenen Beispielseiten (provider 'beispiel'). */
export async function importedBeispiele(): Promise<string[]> {
  const rows = await q(`SELECT material_name FROM pages WHERE provider = 'beispiel' AND copied_from IS NULL`);
  return rows.map((r) => r.material_name as string);
}

export type Usage = {
  email: string; name: string | null; pages: number; pages_month: number; claude: number; infomaniak: number;
  input_tokens: number; output_tokens: number; last_page: string | null;
};

/** Erzeugte Seiten und Tokens pro Person – Kopien aus dem Pool zählen nicht, gelöschte Seiten fehlen. */
export async function usageByUser(): Promise<Usage[]> {
  return (await q(
    `SELECT u.email, u.name, COUNT(p.id)::int AS pages,
       COUNT(p.id) FILTER (WHERE p.created_at >= date_trunc('month', NOW()))::int AS pages_month,
       COUNT(p.id) FILTER (WHERE p.provider = 'claude')::int AS claude,
       COUNT(p.id) FILTER (WHERE p.provider = 'infomaniak')::int AS infomaniak,
       COALESCE(SUM(p.input_tokens),0)::int AS input_tokens, COALESCE(SUM(p.output_tokens),0)::int AS output_tokens,
       to_char(MAX(p.created_at), 'DD.MM.YYYY') AS last_page
     FROM users u LEFT JOIN pages p ON p.user_id = u.id AND p.copied_from IS NULL AND p.provider <> 'beispiel'
     GROUP BY u.email, u.name ORDER BY pages DESC, u.email`
  )) as never;
}
