// Klassen und Gruppen: Ordnung in der Sammlung. Eine Seite kann in mehreren Gruppen liegen,
// eine Gruppe kann per Klassenlink alle ihre freigegebenen Seiten ohne Login zeigen.
import { randomBytes } from "node:crypto";
import { db, ready } from "./db";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

export type Gruppe = {
  id: number;
  user_id: number;
  name: string;
  beschreibung: string | null;
  share_token: string | null;
  created_at: string;
  /** Anzahl zugeordneter Seiten, davon mit Freigabelink (nur diese erscheinen auf der Klassenseite) */
  seiten: number;
  freigegeben: number;
};

const COLS = `g.id, g.user_id, g.name, g.beschreibung, g.share_token, to_char(g.created_at, 'DD.MM.YYYY') AS created_at,
  (SELECT count(*) FROM lerngruppe_seiten ls WHERE ls.group_id = g.id)::int AS seiten,
  (SELECT count(*) FROM lerngruppe_seiten ls JOIN pages p ON p.id = ls.page_id WHERE ls.group_id = g.id AND p.share_token IS NOT NULL)::int AS freigegeben`;

export async function listGruppen(userId: number): Promise<Gruppe[]> {
  return (await q(`SELECT ${COLS} FROM lerngruppen g WHERE g.user_id = $1 ORDER BY lower(g.name)`, [userId])) as Gruppe[];
}

export async function getGruppe(id: number, userId: number, isAdmin: boolean): Promise<Gruppe | null> {
  const rows = await q(`SELECT ${COLS} FROM lerngruppen g WHERE g.id = $1 AND ($2::boolean OR g.user_id = $3)`, [id, isAdmin, userId]);
  return (rows[0] as Gruppe) ?? null;
}

export async function getGruppeByToken(token: string): Promise<Gruppe | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await q(`SELECT ${COLS} FROM lerngruppen g WHERE g.share_token = $1`, [token]);
  return (rows[0] as Gruppe) ?? null;
}

/** Neue Gruppe; bei gleichem Namen wird die bestehende zurückgegeben. */
export async function createGruppe(userId: number, name: string, beschreibung: string | null): Promise<number> {
  const rows = await q(
    `INSERT INTO lerngruppen (user_id, name, beschreibung) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [userId, name, beschreibung]
  );
  return Number(rows[0].id);
}

export async function updateGruppe(id: number, userId: number, isAdmin: boolean, s: { name: string; beschreibung: string | null }) {
  await q(`UPDATE lerngruppen SET name = $4, beschreibung = $5 WHERE id = $1 AND ($2::boolean OR user_id = $3)`, [id, isAdmin, userId, s.name, s.beschreibung]);
}

export async function deleteGruppe(id: number, userId: number, isAdmin: boolean) {
  await q(`DELETE FROM lerngruppen WHERE id = $1 AND ($2::boolean OR user_id = $3)`, [id, isAdmin, userId]);
}

export async function setGruppeShare(id: number, userId: number, isAdmin: boolean, on: boolean): Promise<string | null> {
  const token = on ? randomBytes(18).toString("base64url") : null;
  await q(`UPDATE lerngruppen SET share_token = $4 WHERE id = $1 AND ($2::boolean OR user_id = $3)`, [id, isAdmin, userId, token]);
  return token;
}

export type GruppeRef = { id: number; name: string };

/** Gruppen je Seite für mehrere Seiten auf einmal (Kacheln in der Sammlung). */
export async function gruppenOfPages(pageIds: number[]): Promise<Map<number, GruppeRef[]>> {
  const map = new Map<number, GruppeRef[]>();
  if (pageIds.length === 0) return map;
  const rows = await q(
    `SELECT ls.page_id, g.id, g.name FROM lerngruppe_seiten ls JOIN lerngruppen g ON g.id = ls.group_id WHERE ls.page_id = ANY($1::int[]) ORDER BY lower(g.name)`,
    [pageIds]
  );
  for (const r of rows) {
    const list = map.get(Number(r.page_id)) ?? [];
    list.push({ id: Number(r.id), name: String(r.name) });
    map.set(Number(r.page_id), list);
  }
  return map;
}

/**
 * Zuordnung einer Seite zu den Gruppen ihrer Besitzerin neu setzen (Checkboxen auf der Detailseite).
 * Berührt nur Gruppen von ownerId; fremde Zuordnungen bleiben unangetastet.
 */
export async function setPageGruppen(pageId: number, ownerId: number, groupIds: number[]) {
  await q(`DELETE FROM lerngruppe_seiten WHERE page_id = $1 AND group_id IN (SELECT id FROM lerngruppen WHERE user_id = $2)`, [pageId, ownerId]);
  if (groupIds.length > 0) {
    await q(
      `INSERT INTO lerngruppe_seiten (page_id, group_id) SELECT $1, id FROM lerngruppen WHERE user_id = $2 AND id = ANY($3::int[]) ON CONFLICT DO NOTHING`,
      [pageId, ownerId, groupIds]
    );
  }
}

/** Mehrere eigene Seiten in eine Gruppe aufnehmen (Gruppenseite «Seiten hinzufügen»). */
export async function addPagesToGruppe(groupId: number, userId: number, isAdmin: boolean, pageIds: number[]) {
  if (pageIds.length === 0) return;
  await q(
    `INSERT INTO lerngruppe_seiten (page_id, group_id)
     SELECT p.id, g.id FROM pages p, lerngruppen g
     WHERE g.id = $1 AND ($2::boolean OR g.user_id = $3) AND p.user_id = g.user_id AND p.id = ANY($4::int[])
     ON CONFLICT DO NOTHING`,
    [groupId, isAdmin, userId, pageIds]
  );
}

export async function removePageFromGruppe(groupId: number, pageId: number, userId: number, isAdmin: boolean) {
  await q(
    `DELETE FROM lerngruppe_seiten ls USING lerngruppen g WHERE g.id = ls.group_id AND ls.group_id = $1 AND ls.page_id = $2 AND ($3::boolean OR g.user_id = $4)`,
    [groupId, pageId, isAdmin, userId]
  );
}

export type KlassenSeite = { id: number; title: string; fach: string | null; stufe: string | null; typ: string; share_token: string; added_at: string };

/** Freigegebene Seiten einer Gruppe für die Klassenseite (ohne Login): nur solche mit Freigabelink. */
export async function publicPagesOfGruppe(groupId: number): Promise<KlassenSeite[]> {
  return (await q(
    `SELECT p.id, p.title, p.fach, p.stufe, COALESCE(p.params->>'typ', 'lernseite') AS typ, p.share_token, to_char(ls.added_at, 'DD.MM.YYYY') AS added_at
     FROM lerngruppe_seiten ls JOIN pages p ON p.id = ls.page_id
     WHERE ls.group_id = $1 AND p.share_token IS NOT NULL ORDER BY ls.added_at DESC, p.id DESC`,
    [groupId]
  )) as KlassenSeite[];
}
