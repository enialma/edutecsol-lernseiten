// Erzeugte Bilder: Metadaten + Bilddaten (base64) in Postgres, Freigabelink für Lernende/Moodle,
// Sichtbarkeit für Schule/Pool wie bei den Lernseiten, Beispiel-Flag für die öffentliche Bilder-Seite.
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
  pool: boolean;
  school: boolean;
  beispiel: boolean;
  copied_from: number | null;
  created_at: string;
  owner_email: string;
  owner_name: string | null;
  owner_institution: string | null;
};
export type ImageFull = ImageMeta & { data_b64: string };

const META = `b.id, b.user_id, b.title, b.einsatz, b.thema, b.params, b.prompt, b.instruction, b.parent_id, b.provider, b.model, b.size, b.quality,
  b.input_tokens, b.output_tokens, b.duration_ms, b.mime, (length(b.data_b64) * 3 / 4) AS bytes, b.share_token, b.pool, b.school, b.beispiel, b.copied_from,
  to_char(b.created_at, 'DD.MM.YYYY HH24:MI') AS created_at, u.email AS owner_email, u.name AS owner_name, i.name AS owner_institution`;
const FROM = `FROM images b JOIN users u ON u.id = b.user_id LEFT JOIN institutions i ON i.id = u.institution_id`;
// Für die eigene Schule freigegeben: Autorin und betrachtende Person gehören zur selben Institution ($n = userId)
const sameSchool = (n: number) => `(b.school = TRUE AND u.institution_id IS NOT NULL AND u.institution_id = (SELECT institution_id FROM users WHERE id = $${n}))`;
// Lesen: eigenes Bild, Admin, Pool, Schule oder öffentliches Beispiel ($2 = isAdmin, $3 = userId)
const visible = () => `($2 OR b.user_id = $3 OR b.pool = TRUE OR b.beispiel = TRUE OR ${sameSchool(3)})`;
// Schreiben: eigenes Bild oder Admin ($2 = userId). $2 muss immer referenziert werden (Postgres-Typbestimmung).
const canEdit = (isAdmin: boolean) => (isAdmin ? "$2::int IS NOT NULL" : "b.user_id = $2");

export async function createImage(i: {
  userId: number; title: string; einsatz?: string | null; thema?: string | null; params: unknown; prompt: string;
  instruction?: string | null; parentId?: number | null; provider: string; model?: string | null; size?: string | null; quality?: string | null;
  inputTokens: number; outputTokens: number; durationMs: number; mime: string; dataB64: string; copiedFrom?: number | null;
}): Promise<number> {
  const rows = await q(
    `INSERT INTO images (user_id, title, einsatz, thema, params, prompt, instruction, parent_id, provider, model, size, quality,
       input_tokens, output_tokens, duration_ms, mime, data_b64, copied_from)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
    [i.userId, i.title, i.einsatz ?? null, i.thema ?? null, JSON.stringify(i.params), i.prompt, i.instruction ?? null, i.parentId ?? null,
     i.provider, i.model ?? null, i.size ?? null, i.quality ?? null, i.inputTokens, i.outputTokens, i.durationMs, i.mime, i.dataB64, i.copiedFrom ?? null]
  );
  return Number(rows[0].id);
}

export type ImageListMode = "mine" | "school" | "pool" | "all";

export async function listImages(userId: number, mode: ImageListMode): Promise<ImageMeta[]> {
  const where =
    mode === "mine" ? "b.user_id = $1" :
    mode === "school" ? `${sameSchool(1)} AND b.user_id <> $1` :
    mode === "pool" ? "b.pool = TRUE AND $1::int IS NOT NULL" :
    "$1::int IS NOT NULL";
  const rows = await q(`SELECT ${META} ${FROM} WHERE ${where} ORDER BY b.created_at DESC`, [userId]);
  return rows as ImageMeta[];
}

export async function getImageMeta(id: number, userId: number, isAdmin: boolean): Promise<ImageMeta | null> {
  const rows = await q(`SELECT ${META} ${FROM} WHERE b.id = $1 AND ${visible()}`, [id, isAdmin, userId]);
  return (rows[0] as ImageMeta) ?? null;
}

export async function getImage(id: number, userId: number, isAdmin: boolean): Promise<ImageFull | null> {
  const rows = await q(`SELECT ${META}, b.data_b64 ${FROM} WHERE b.id = $1 AND ${visible()}`, [id, isAdmin, userId]);
  return (rows[0] as ImageFull) ?? null;
}

export async function getImageByToken(token: string): Promise<{ mime: string; data_b64: string; title: string; size: string | null } | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await q(`SELECT mime, data_b64, title, size FROM images WHERE share_token = $1`, [token]);
  return (rows[0] as { mime: string; data_b64: string; title: string; size: string | null }) ?? null;
}

/** Varianten: Ausgangsbild und alle direkt daraus nachgebesserten Bilder (nur eigene/sichtbare). */
export async function imageFamily(id: number, parentId: number | null, userId: number, isAdmin: boolean): Promise<ImageMeta[]> {
  const root = parentId ?? id;
  const rows = await q(
    `SELECT ${META} ${FROM} WHERE (b.id = $1 OR b.parent_id = $1) AND ${visible()} ORDER BY b.created_at`,
    [root, isAdmin, userId]
  );
  return rows as ImageMeta[];
}

/** Freigabelink setzen oder entfernen; gibt den (neuen oder bestehenden) Token zurück. */
export async function setImageShare(id: number, userId: number, isAdmin: boolean, on: boolean): Promise<string | null> {
  if (!on) {
    await q(`UPDATE images b SET share_token = NULL WHERE b.id = $1 AND (${canEdit(isAdmin)})`, [id, userId]);
    return null;
  }
  const token = randomBytes(18).toString("base64url");
  const rows = await q(
    `UPDATE images b SET share_token = COALESCE(b.share_token, $3) WHERE b.id = $1 AND (${canEdit(isAdmin)}) RETURNING share_token`,
    [id, userId, token]
  );
  return (rows[0]?.share_token as string) ?? null;
}

export type ImageVisibility = "private" | "school" | "all";

export async function setImageVisibility(id: number, userId: number, isAdmin: boolean, v: ImageVisibility) {
  await q(`UPDATE images b SET pool = $3, school = $4 WHERE b.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, v === "all", v === "school"]);
}

/** Admin: Bild als Beispiel auf die öffentliche Bilder-Seite stellen (braucht einen Freigabelink). */
export async function setImageExample(id: number, on: boolean) {
  const token = randomBytes(18).toString("base64url");
  await q(`UPDATE images SET beispiel = $2, share_token = CASE WHEN $2 THEN COALESCE(share_token, $3) ELSE share_token END WHERE id = $1`, [id, on, token]);
}

export type ExampleImage = {
  id: number; title: string; einsatz: string | null; thema: string | null; params: Record<string, unknown>; prompt: string;
  provider: string; share_token: string; created_at: string;
};

/** Öffentliche Beispiele (ohne Login), neueste zuerst. */
export async function listExampleImages(): Promise<ExampleImage[]> {
  const rows = await q(
    `SELECT id, title, einsatz, thema, params, prompt, provider, share_token, to_char(created_at, 'DD.MM.YYYY') AS created_at
     FROM images WHERE beispiel = TRUE AND share_token IS NOT NULL ORDER BY created_at DESC LIMIT 50`
  );
  return rows as ExampleImage[];
}

export async function renameImage(id: number, userId: number, isAdmin: boolean, title: string) {
  await q(`UPDATE images b SET title = $3 WHERE b.id = $1 AND (${canEdit(isAdmin)})`, [id, userId, title]);
}

/** Freigegebenes Bild (Schule oder Pool) in die eigene Sammlung kopieren. */
export async function duplicateImage(id: number, userId: number, isAdmin: boolean): Promise<number | null> {
  const src = await getImage(id, userId, isAdmin);
  if (!src) return null;
  return createImage({
    userId, title: src.title, einsatz: src.einsatz, thema: src.thema, params: src.params, prompt: src.prompt,
    instruction: src.instruction, provider: src.provider, model: src.model, size: src.size, quality: src.quality,
    inputTokens: 0, outputTokens: 0, durationMs: 0, mime: src.mime, dataB64: src.data_b64, copiedFrom: src.id,
  });
}

export async function deleteImage(id: number, userId: number, isAdmin: boolean) {
  await q(`UPDATE images SET parent_id = NULL WHERE parent_id = $1`, [id]);
  await q(`DELETE FROM images b WHERE b.id = $1 AND (${canEdit(isAdmin)})`, [id, userId]);
}
