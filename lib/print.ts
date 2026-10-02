// Einheitliche Druck-/PDF-Vorlage, die beim Ausliefern in jede erzeugte Lernseite eingesetzt wird.
// Sie liegt am Ende von <head> und überschreibt damit die vom Modell erzeugte Druck-CSS.

export const PRINT_MARKER = "<!-- lernwege-print -->";

const PRINT_CSS = `
@page { size: A4 landscape; margin: 12mm 14mm; }
@media print {
  html, body { background: #fff !important; color: #111 !important; font-size: 11pt !important; line-height: 1.4 !important; }
  * { box-shadow: none !important; text-shadow: none !important; animation: none !important; transition: none !important; }
  body { max-width: none !important; margin: 0 !important; padding: 0 !important; }
  /* Bedienelemente weg */
  button, [role="tablist"], [role="tab"], nav, .tabs, .tab-bar, .tabbar, .reiter, .toolbar, .no-print { display: none !important; }
  input[type="button"], input[type="submit"] { display: none !important; }
  a[href^="http"]::after { content: ""; }
  /* Verborgene Inhalte sichtbar (alle Zugänge, Lösungen) */
  [hidden], .hidden, [aria-hidden="true"]:not(svg):not(span) { display: block !important; }
  [role="tabpanel"], .panel, .tab-panel, .zugang { display: block !important; }
  details { display: block !important; }
  details > summary { list-style: none; font-weight: 600; }
  details > :not(summary) { display: block !important; }
  /* Grosse Abschnitte je auf neuer Seite, nichts mittendrin brechen */
  [role="tabpanel"], .panel, .tab-panel, .zugang, section.zugang, .teacher, .lehrperson, .fuer-lehrperson { break-before: page; page-break-before: always; }
  [role="tabpanel"]:first-of-type, .panel:first-of-type, .tab-panel:first-of-type { break-before: auto; page-break-before: auto; }
  h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
  p, li, tr, .card, .box, .aufgabe, .frage, figure, svg, table, pre { break-inside: avoid; page-break-inside: avoid; }
  /* Eingabefelder als Linien, Häkchen und Hinweise ausblenden */
  input[type="text"], input[type="number"], textarea, select { border: none !important; border-bottom: 1px solid #333 !important; background: #fff !important; box-shadow: none !important; }
  input[type="checkbox"], input[type="radio"] { -webkit-appearance: checkbox; appearance: auto; }
  .feedback, .hint, .ok, .check-ok, .correct { color: #111 !important; }
  /* Farbflächen dezent */
  header, .hero { background: #fff !important; color: #111 !important; border-bottom: 2px solid #333; }
  .card, .box, section { background: #fff !important; border-color: #999 !important; }
  svg { max-width: 100% !important; height: auto !important; }
  img { max-width: 100% !important; }
}
`;

/** Setzt die Druckvorlage vor </head> ein (idempotent). */
export function withPrintCss(html: string): string {
  if (html.includes(PRINT_MARKER)) return html;
  const block = `${PRINT_MARKER}\n<style media="print" id="lernwege-print">${PRINT_CSS}</style>\n`;
  const i = html.search(/<\/head>/i);
  if (i >= 0) return html.slice(0, i) + block + html.slice(i);
  const j = html.search(/<body[^>]*>/i);
  if (j >= 0) return html.slice(0, j) + block + html.slice(j);
  return block + html;
}
