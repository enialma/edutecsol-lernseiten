// Nachbessern einer bestehenden Lernseite: Die KI schreibt die Seite nicht neu, sondern liefert nur Ersetzungsblöcke
// (alter Ausschnitt → neuer Ausschnitt). Der Server setzt sie ein und prüft das Ergebnis; alles andere bleibt unverändert.
import { anzahlLoesungsbereiche } from "./loesung";

export const MAX_AUFTRAG = 1000;
/** Gelungene Nachbesserungen pro Lernseite (Admins ohne Grenze); Fassungswechsel zählen nicht. */
export const MAX_NACHBESSERUNGEN = 5;

export const NACHBESSERN_SYSTEM = `Du überarbeitest eine bestehende Lernseite (eine einzelne HTML-Datei) nach dem Auftrag einer Lehrperson. Du schreibst die Seite nicht neu, sondern gibst nur die nötigen Änderungen als Ersetzungsblöcke aus. Der Server setzt die Blöcke in die Seite ein; alles, was du nicht ersetzt, bleibt Zeichen für Zeichen erhalten.

FORMAT
Jede Änderung ist ein Block:
<<<<<<< ALT
exakter Ausschnitt aus der aktuellen Seite
=======
neuer Text für genau diesen Ausschnitt
>>>>>>> NEU

Regeln für die Blöcke:
- ALT ist ein wörtlicher Ausschnitt aus der Seite, mit denselben Zeichen, Leerzeichen und Zeilenumbrüchen. Er muss genau einmal in der Seite vorkommen. Nimm so viel umgebenden Text dazu, dass er eindeutig ist, aber nicht mehr als nötig (meist eine bis einige Zeilen).
- Blöcke dürfen sich nicht überschneiden. Mehrere Änderungen an derselben Stelle fasst du in einem Block zusammen.
- Zum Einfügen nimmst du eine bestehende Stelle als ALT und gibst sie unter NEU zusammen mit der Ergänzung wieder aus. Zum Löschen bleibt NEU leer.
- Ausserhalb der Blöcke schreibst du nur eine letzte Zeile «NOTIZ: …» mit einem Satz, was du geändert hast. Keine Codeblöcke, keine Erklärungen, nicht die ganze Seite.

INHALT
- Setze den Auftrag vollständig um und ändere nichts anderes: Aufbau, Gestaltung, CSS und Skripte bleiben, wie sie sind, ausser der Auftrag verlangt es.
- Halte die Seite stimmig. Ändert sich eine Aufgabe, eine Zahl oder eine Antwort, passe auch alles an, was davon abhängt: die Lösungen und Wege im Bereich für die Lehrperson (<details class="lehrperson">), die Rückmeldelogik der Eingabefelder und Auswahlaufgaben im JavaScript (richtige Werte, Toleranzen, Hinweise), Punkte und Auswertung. Rechne neue Lösungen nach.
- Der Bereich <details class="lehrperson"> bleibt mit dieser Klasse erhalten.
- Sprache: wie die Seite; Deutsch in Schweizer Rechtschreibung, also nie ß, sondern ss.
- Lässt sich der Auftrag nicht mit einzelnen Änderungen umsetzen, weil fast die ganze Seite neu entstehen müsste, oder ist er unklar oder passt er nicht zu einer Lernseite, gib keine Blöcke aus, sondern nur eine Zeile «ABGELEHNT: …» mit der Begründung in einem Satz.`;

export function nachbessernUser(html: string, auftrag: string): string {
  return `<seite>\n${html}\n</seite>\n\n<auftrag>\n${auftrag}\n</auftrag>\n\nGib die Ersetzungsblöcke für diesen Auftrag aus.`;
}

/** Zweiter Versuch: dieselbe Seite, die erste Antwort und was daran nicht passte. */
export function nachbessernRetryUser(html: string, auftrag: string, ersteAntwort: string, probleme: string[]): string {
  return `${nachbessernUser(html, auftrag)}

Dein erster Versuch liess sich nicht einsetzen:
<erster_versuch>
${ersteAntwort}
</erster_versuch>

Probleme:
${probleme.map((p) => `- ${p}`).join("\n")}

Gib die vollständige, korrigierte Liste aller Blöcke erneut aus (nicht nur die fehlerhaften). Kopiere jeden ALT-Ausschnitt wörtlich aus der Seite.`;
}

export type Block = { alt: string; neu: string };
export type Antwort = { bloecke: Block[]; notiz: string | null; abgelehnt: string | null };

const BLOCK_RE = /<{7}[ \t]*ALT[ \t]*\r?\n([\s\S]*?)\r?\n={7}[ \t]*\r?\n([\s\S]*?)(?:\r?\n)?>{7}[ \t]*NEU/g;

export function parseAntwort(roh: string): Antwort {
  // Denkspuren mancher Modelle (z. B. Qwen) können Entwürfe von Blöcken enthalten
  const text = roh.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const bloecke = [...text.matchAll(BLOCK_RE)].map((m) => ({ alt: m[1], neu: m[2] }));
  const rest = text.replace(BLOCK_RE, "");
  return {
    bloecke,
    notiz: rest.match(/^\s*NOTIZ:\s*(.+)$/m)?.[1].trim() ?? null,
    abgelehnt: rest.match(/^\s*ABGELEHNT:\s*(.+)$/m)?.[1].trim() ?? null,
  };
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Fundstelle eines ALT-Ausschnitts: wörtlich, sonst mit beliebigem Leerraum (Modelle verändern gern Einrückungen). */
function finde(html: string, alt: string): [number, number][] {
  if (!alt.trim()) return [];
  const exakt: [number, number][] = [];
  for (let i = html.indexOf(alt); i >= 0; i = html.indexOf(alt, i + 1)) exakt.push([i, i + alt.length]);
  if (exakt.length) return exakt;
  const re = new RegExp(alt.trim().split(/\s+/).map(esc).join("\\s+"), "g");
  return [...html.matchAll(re)].map((m) => [m.index, m.index + m[0].length] as [number, number]);
}

const kurz = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > 80 ? `«${t.slice(0, 80)}…»` : `«${t}»`;
};

/** Setzt alle Blöcke ein oder keinen: Bei Problemen kommt die Liste zurück, das HTML bleibt unangetastet. */
export function einsetzen(html: string, bloecke: Block[]): { html: string } | { probleme: string[] } {
  const probleme: string[] = [];
  const stellen: { a: number; b: number; neu: string; nr: number }[] = [];
  bloecke.forEach((bl, i) => {
    const treffer = finde(html, bl.alt);
    if (treffer.length === 1) stellen.push({ a: treffer[0][0], b: treffer[0][1], neu: bl.neu, nr: i + 1 });
    else if (treffer.length === 0) probleme.push(`Block ${i + 1}: Der ALT-Ausschnitt ${kurz(bl.alt)} kommt in der Seite nicht vor.`);
    else probleme.push(`Block ${i + 1}: Der ALT-Ausschnitt ${kurz(bl.alt)} kommt ${treffer.length}-mal vor; nimm mehr umgebenden Text dazu.`);
  });
  stellen.sort((x, y) => x.a - y.a);
  for (let i = 1; i < stellen.length; i++) {
    if (stellen[i].a < stellen[i - 1].b) probleme.push(`Block ${stellen[i - 1].nr} und Block ${stellen[i].nr} überschneiden sich; fasse sie zusammen.`);
  }
  if (probleme.length) return { probleme };
  let out = html;
  for (const s of [...stellen].reverse()) out = out.slice(0, s.a) + s.neu + out.slice(s.b);
  return { html: out };
}

/** Grobe Prüfung des Ergebnisses; liefert eine Meldung für die Lehrperson oder null. */
export function pruefeErgebnis(vorher: string, nachher: string): string | null {
  if (nachher === vorher) return "Die Änderungen haben die Seite nicht verändert.";
  if (/<\/html>/i.test(vorher) && !/<\/html>/i.test(nachher)) return "Nach den Änderungen wäre die Seite unvollständig.";
  if (nachher.length < vorher.length * 0.3) return "Die Änderungen hätten den grössten Teil der Seite entfernt.";
  if (anzahlLoesungsbereiche(nachher) < anzahlLoesungsbereiche(vorher)) return "Die Änderungen hätten den Bereich für die Lehrperson entfernt.";
  return null;
}
