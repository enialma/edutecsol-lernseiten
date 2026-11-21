// Rechenregeln für das Monatskontingent (ohne Datenbank, darum auch im Browser nutzbar).
// Eine neue Lernseite kostet 1, eine Nachbesserung 0.2 im Kontingent der verwendeten KI.

export const KOSTEN_SEITE = 1;
export const KOSTEN_NACHBESSERN = 0.2;

/** Auf eine Nachkommastelle runden (verhindert 0.1999… bei 10 − 9.8). */
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Was im Kontingent übrig ist; null = ohne Limit (Admins). */
export function restKontingent(q: { used: number; limit: number | null }): number | null {
  return q.limit === null ? null : Math.max(0, r1(q.limit - q.used));
}

/** Reicht das Kontingent für diese Kosten? Das Kontingent wird nie überschritten. */
export function reicht(q: { used: number; limit: number | null }, kosten: number): boolean {
  const rest = restKontingent(q);
  return rest === null || rest >= kosten;
}

/** Zahl fürs Kontingent anzeigen: 3, 3.4 (Schweizer Schreibweise mit Punkt). */
export function kontZahl(n: number): string {
  return r1(n).toLocaleString("de-CH", { maximumFractionDigits: 1 });
}
