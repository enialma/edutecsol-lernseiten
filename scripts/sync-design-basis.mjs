// Überträgt die Designbasis aus lib/design-basis.ts in den statischen Prompt-Generator (public/prompt-generator-v2.html),
// damit kopierte Prompts dieselbe Gestaltung liefern wie die Plattform. Aufruf: node scripts/sync-design-basis.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ts = readFileSync("lib/design-basis.ts", "utf8");
const css = ts.match(/export const DESIGN_CSS = `([\s\S]*?)`;/)[1];
const skeleton = ts.match(/export const DESIGN_SKELETON = `([\s\S]*?)`;/)[1];

const text = `§DESIGNBASIS (für die Website, zwingend)
- Übernimm dieses CSS unverändert als erstes <style>-Element im <head>; ergänze danach ein zweites <style> nur für die themenspezifische Visualisierung und Kleinigkeiten. Keine anderen Farben als die Variablen (--navy, --terra, --ochre, --cream, --ok, --err); keine Schatten, keine Verläufe, keine Emojis als Icons.
<style>
${css}
</style>
- Baue die Seite nach diesem Grundgerüst (Klassen beibehalten, Inhalte ersetzen, Anzahl Zugänge gemäss Auftrag):
${skeleton}
- Reiter: Klick setzt .active auf dem Reiter und .show auf dem zugehörigen Panel, aria-selected entsprechend; Pfeiltasten wechseln den Reiter.
- Rückmeldung: richtige Eingabe → Klasse ok auf dem Feld und Text im .feedback (z. B. «Richtig»); falsche → Klasse err und ein Hinweis ohne Lösung. Auswahlaufgaben mit .choices/.choice analog.
- Der Aha-Moment des obersten Zugangs steht in einem .aha-Block, der erst nach Klick auf einen .btn erscheint.`;

const file = "public/prompt-generator-v2.html";
let html = readFileSync(file, "utf8");
const START = "/* DESIGNBASIS-START (automatisch aus lib/design-basis.ts, nicht von Hand ändern) */";
const END = "/* DESIGNBASIS-END */";
const block = `${START}\n  const DESIGNBASIS = ${JSON.stringify(text)};\n  ${END}`;
if (html.includes(START)) {
  html = html.replace(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), block);
} else {
  // nach dem Beginn des letzten <script>-Blocks einsetzen
  const i = html.lastIndexOf("<script>");
  if (i < 0) throw new Error("Kein <script> gefunden");
  html = html.slice(0, i + 8) + "\n  " + block + html.slice(i + 8);
}
writeFileSync(file, html);
console.log("Designbasis übertragen:", text.length, "Zeichen");
