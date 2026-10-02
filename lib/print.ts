// Einheitliche Druck-/PDF-Vorlage, die beim Ausliefern in jede erzeugte Lernseite eingesetzt wird.
// Sie liegt am Ende von <head> und überschreibt damit die vom Modell erzeugte Druck-CSS.

export const PRINT_MARKER = "<!-- lernwege-print -->";

const PRINT_CSS = `
@page { size: A4 portrait; margin: 14mm 16mm; }
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
  /* CI-Farben: Navy #1E3246, Terra #B84816, Ocker #F1A51A, Creme #F6EFE2 */
  h1, h2, h3, h4 { color: #1E3246 !important; }
  h1 { font-size: 20pt !important; border-bottom: 2pt solid #B84816 !important; padding-bottom: 4pt !important; }
  h2 { font-size: 15pt !important; margin-top: 14pt !important; }
  h3 { font-size: 12.5pt !important; }
  header, .hero { background: transparent !important; color: #1E3246 !important; padding: 0 0 .6rem !important; margin: 0 0 1rem !important; border: 0 !important; box-shadow: none !important; }
  .card, .box, section, article, aside, [role="tabpanel"], .panel, .tab-panel, .zugang, details {
    background: transparent !important; color: #111 !important;
    border: 1pt solid #1E3246 !important; border-radius: 4pt !important; padding: 8pt 10pt !important; margin: 0 0 10pt !important;
  }
  [role="tabpanel"] > .card, .panel > .card, section > section, section > .card { border-color: #cdc4ad !important; }
  details.lehrperson, .lehrperson, .teacher { border-color: #B84816 !important; }
  details > summary { color: #B84816 !important; }
  blockquote, .hinweis, .tipp, .info { border-left: 3pt solid #F1A51A !important; border-top: 0 !important; border-right: 0 !important; border-bottom: 0 !important; padding-left: 8pt !important; background: transparent !important; }
  table { border-collapse: collapse !important; }
  td, th { border: 1pt solid #1E3246 !important; padding: .25rem .5rem !important; }
  th { background: #F6EFE2 !important; color: #1E3246 !important; }
  a { color: #B84816 !important; text-decoration: none !important; }
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
