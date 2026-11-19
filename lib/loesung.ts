// Lösungen über den Freigabelink: Der Lehrpersonen-Bereich (<details class="lehrperson">) wird beim Ausliefern
// weggelassen, bis die Lehrperson ihn freigibt. Nur für Seiten ab der Druckvorlage vom 2.10.2026, die diese
// Markierung verlässlich setzen (pages.loesung_version); ältere Seiten werden unverändert ausgeliefert.
import { parse } from "node-html-parser";
import type { PageFull } from "./pages";

// Kommentare, Skripte und Styles am Stück überspringen, damit ein «</details>» darin nicht mitzählt
const TOKEN = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<(\/?)details\b[^>]*>/gi;

const istLehrperson = (tag: string) => (/\sclass\s*=\s*["']?([^"'>]*)/i.exec(tag)?.[1] ?? "").split(/\s+/).includes("lehrperson");

/** Lehrpersonen-Bereiche als [Anfang, Ende) im HTML: nur äusserste Blöcke mit passendem </details>. */
function bloecke(html: string): [number, number][] {
  const out: [number, number][] = [];
  let tiefe = 0, start = 0;
  for (const m of html.matchAll(TOKEN)) {
    if (m[1] || m[0].startsWith("<!--")) continue;
    if (m[2]) {
      if (tiefe > 0 && --tiefe === 0) out.push([start, m.index + m[0].length]);
    } else if (tiefe > 0) tiefe++;
    else if (istLehrperson(m[0])) { start = m.index; tiefe = 1; }
  }
  return out;
}

/** Anzahl sauber abgegrenzter Lehrpersonen-Bereiche (Nachbessern prüft, dass keiner verloren geht). */
export function anzahlLoesungsbereiche(html: string): number {
  return bloecke(html).length;
}

/** Schalter «Lösungen für Lernende» anbieten: neue Seitenversion und ein sauber abgegrenzter Lehrpersonen-Bereich. */
export function loesungSchaltbar(page: PageFull): boolean {
  return page.loesung_version && bloecke(page.html).length > 0;
}

/** HTML für den Freigabelink: ohne Lösungen, solange der Schalter aus ist. */
export function fuerLernende(page: PageFull): string {
  return loesungSchaltbar(page) && !page.loesung_offen ? ohneLoesung(page.html) : page.html;
}

// Elemente mit id bleiben als leere, unsichtbare Hüllen stehen, damit Seitenskripte sie weiter finden
// (z. B. füllt das Lernspiel die Lösungsliste in #loesungen); Skripte aus dem Block laufen weiter.
// Tabellenteile brauchen ihre Tabelle, sonst verwirft sie der Browser.
const VOID = new Set(["area", "br", "col", "embed", "hr", "img", "input", "source", "track", "wbr"]);
const HUELLE: Record<string, [string, string]> = {
  thead: ["<table>", "</table>"], tbody: ["<table>", "</table>"], tfoot: ["<table>", "</table>"], caption: ["<table>", "</table>"],
  colgroup: ["<table>", "</table>"], col: ["<table><colgroup>", "</colgroup></table>"],
  tr: ["<table><tbody>", "</tbody></table>"], td: ["<table><tbody><tr>", "</tr></tbody></table>"], th: ["<table><tbody><tr>", "</tr></tbody></table>"],
};
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function platzhalter(block: string): string {
  const root = parse(block);
  const aussen = root.querySelector("details");
  const huellen = root.querySelectorAll("[id]").filter((el) => el !== aussen).map((el) => {
    const tag = el.rawTagName.toLowerCase();
    const [vor, nach] = HUELLE[tag] ?? ["", ""];
    const id = ` id="${attr(el.getAttribute("id") ?? "")}"`;
    return vor + (VOID.has(tag) ? `<${tag}${id}>` : `<${tag}${id}></${tag}>`) + nach;
  }).join("");
  const skripte = root.querySelectorAll("script").map((s) => s.toString()).join("");
  const id = aussen?.getAttribute("id");
  return `<details class="lehrperson"${id ? ` id="${attr(id)}"` : ""} hidden aria-hidden="true" style="display:none!important">${huellen}</details>${skripte}`;
}

export function ohneLoesung(html: string): string {
  let out = html;
  for (const [a, b] of bloecke(html).reverse()) out = out.slice(0, a) + platzhalter(html.slice(a, b)) + out.slice(b);
  return out;
}
