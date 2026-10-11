// Erzeugte Bilder: Metadaten + Bilddaten (base64) in Postgres, Freigabelink für Lernende/Moodle.
import { randomBytes } from "node:crypto";
import { db, ready } from "./db";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

export type ImageMeta = {
  id: number;
  user_id: number;
  title: string;
  einsatz: string | null;
  thema: string | null;
  params: Record<string, unknown>;
  prompt: string;
  instruction: string | null;
  parent_id: number | null;
  provider: string;
  model: string | null;
  size: string | null;
  quality: string | null;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number | null;
  mime: string;
  bytes: number;
  share_token: string | null;
  created_at: string;
  owner_email: string;
  owner_name: string | null;
};
export type ImageFull = ImageMeta & { data_b64: string };

const META = `b.id, b.user_id, b.title, b.einsatz, b.thema, b.params, b.prompt, b.instruction, b.parent_id, b.provider, b.model, b.size, b.quality,
  b.input_tokens, b.output_tokens, b.duration_ms, b.mime, (length(b.data_b64) * 3 / 4) AS bytes, b.share_token,
  to_char(b.created_at, 'DD.MM.YYYY HH24:MI') AS created_at, u.email AS owner_email, u.name AS owner_name`;
const FROM = `FROM images b JOIN users u ON u.id = b.user_id`;

export async function createImage(i: {
  userId: number; title: string; einsatz?: string | null; thema?: string | null; params: unknown; prompt: string;
  instruction?: string | null; parentId?: number | null; provider: string; model?: string | null; size?: string | null; quality?: string | null;
  inputTokens: number; outputTokens: number; durationMs: number; mime: string; dataB64: string;
}): Promise<number> {
  const rows = await q(
    `INSERT INTO images (user_id, title, einsatz, thema, params, prompt, instruction, parent_id, provider, model, size, quality,
       input_tokens, output_tokens, duration_ms, mime, data_b64)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
    [i.userId, i.title, i.einsatz ?? null, i.thema ?? null, JSON.stringify(i.params), i.prompt, i.instruction ?? null, i.parentId ?? null,
     i.provider, i.model ?? null, i.size ?? null, i.quality ?? null, i.inputTokens, i.outputTokens, i.durationMs, i.mime, i.dataB64]
  );
  return Number(rows[0].id);
}

export async function listImages(userId: number, all: boolean): Promise<ImageMeta[]> {
  const rows = await q(`SELECT ${META} ${FROM} WHERE ($2 OR b.user_id = $1) ORDER BY b.created_at DESC`, [userId, all]);
  return rows as ImageMeta[];
}

function canSee(isAdmin: boolean) {
  return isAdmin ? "$2::int IS NOT NULL" : "b.user_id = $2";
}

export async function getImageMeta(id: number, userId: number, isAdmin: boolean): Promise<ImageMeta | null> {
  const rows = await q(`SELECT ${META} ${FROM} WHERE b.id = $1 AND (${canSee(isAdmin)})`, [id, userId]);
  return (rows[0] as ImageMeta) ?? null;
}

export async function getImage(id: number, userId: number, isAdmin: boolean): Promise<ImageFull | null> {
  const rows = await q(`SELECT ${META}, b.data_b64 ${FROM} WHERE b.id = $1 AND (${canSee(isAdmin)})`, [id, userId]);
  return (rows[0] as ImageFull) ?? null;
}

export async function getImageByToken(token: string): Promise<{ mime: string; data_b64: string; title: string } | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await q(`SELECT mime, data_b64, title FROM images WHERE share_token = $1`, [token]);
  return (rows[0] as { mime: string; data_b64: string; title: string }) ?? null;
}

/** Varianten: Ausgangsbild und alle direkt daraus nachgebesserten Bilder. */
export async function imageFamily(id: number, parentId: number | null, userId: number, isAdmin: boolean): Promise<ImageMeta[]> {
  const root = parentId ?? id;
  const rows = await q(
    `SELECT ${META} ${FROM} WHERE (b.id = $1 OR b.parent_id = $1) AND (${canSee(isAdmin)}) ORDER BY b.created_at`,
    [root, userId]
  );
  return rows as ImageMeta[];
}

export async function setImageShare(id: number, userId: number, isAdmin: boolean, on: boolean): Promise<string | null> {
  const token = on ? randomBytes(18).toString("base64url") : null;
  await q(`UPDATE images b SET share_token = $3 WHERE b.id = $1 AND (${canSee(isAdmin)})`, [id, userId, token]);
  return token;
}

export async function renameImage(id: number, userId: number, isAdmin: boolean, title: string) {
  await q(`UPDATE images b SET title = $3 WHERE b.id = $1 AND (${canSee(isAdmin)})`, [id, userId, title]);
}

export async function deleteImage(id: number, userId: number, isAdmin: boolean) {
  await q(`UPDATE images SET parent_id = NULL WHERE parent_id = $1`, [id]);
  await q(`DELETE FROM images b WHERE b.id = $1 AND (${canSee(isAdmin)})`, [id, userId]);
}
