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
  owner_email?: string;
};
export type PageFull = PageMeta & { html: string };

const META = `p.id, p.user_id, p.title, p.fach, p.stufe, p.thema, p.params, p.material_name, p.provider, p.model,
  p.input_tokens, p.output_tokens, p.duration_ms, p.notiz,
  to_char(p.created_at, 'DD.MM.YYYY HH24:MI') AS created_at, length(p.html) AS html_bytes`;

export async function createPage(input: {
  userId: number; title: string; fach?: string; stufe?: string; thema?: string; params: unknown;
  materialName?: string | null; provider: string; model?: string; inputTokens: number; outputTokens: number;
  durationMs: number; html: string; notiz?: string | null;
}): Promise<number> {
  const rows = await q(
    `INSERT INTO pages (user_id, title, fach, stufe, thema, params, material_name, provider, model, input_tokens, output_tokens, duration_ms, html, notiz)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [input.userId, input.title, input.fach || null, input.stufe || null, input.thema || null, JSON.stringify(input.params),
     input.materialName ?? null, input.provider, input.model ?? null, input.inputTokens, input.outputTokens, input.durationMs,
     input.html, input.notiz ?? null]
  );
  return Number(rows[0].id);
}

export async function listPages(userId: number, all = false): Promise<PageMeta[]> {
  if (all) {
    return (await q(`SELECT ${META}, u.email AS owner_email FROM pages p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC`)) as PageMeta[];
  }
  return (await q(`SELECT ${META} FROM pages p WHERE p.user_id = $1 ORDER BY p.created_at DESC`, [userId])) as PageMeta[];
}

export async function getPage(id: number, userId: number, isAdmin: boolean): Promise<PageFull | null> {
  const rows = await q(
    `SELECT ${META}, p.html FROM pages p WHERE p.id = $1 AND ($2 OR p.user_id = $3)`,
    [id, isAdmin, userId]
  );
  return (rows[0] as PageFull) ?? null;
}

export async function deletePage(id: number, userId: number, isAdmin: boolean) {
  await q(`DELETE FROM pages WHERE id = $1 AND ($2 OR user_id = $3)`, [id, isAdmin, userId]);
}

export async function usageByUser(): Promise<{ email: string; pages: number; input_tokens: number; output_tokens: number }[]> {
  return (await q(
    `SELECT u.email, COUNT(p.id)::int AS pages, COALESCE(SUM(p.input_tokens),0)::int AS input_tokens, COALESCE(SUM(p.output_tokens),0)::int AS output_tokens
     FROM users u LEFT JOIN pages p ON p.user_id = u.id GROUP BY u.email ORDER BY pages DESC, u.email`
  )) as never;
}
