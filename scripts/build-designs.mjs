// Liest die Designs aus designs/*.css und schreibt lib/designs.generated.ts, damit das CSS ohne Dateizugriff
// zur Laufzeit (Vercel) in die Seiten kommt. Läuft automatisch vor «npm run dev» und «npm run build»;
// von Hand: node scripts/build-designs.mjs. Regeln für neue Designs: designs/README.md
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const DIR = new URL("../designs/", import.meta.url);
const OUT = new URL("../lib/designs.generated.ts", import.meta.url);

// Kommentare raus, damit sie nicht in jede Lernseite wandern; Zeilen sonst unverändert
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.trimEnd()).filter((l) => l.trim()).join("\n");

/** Funktionsregeln und alle Designs mit ihren Angaben aus dem Kopfkommentar (@name, @beschreibung, @farben, @reihenfolge). */
export function ladeDesigns() {
  const funktion = strip(readFileSync(new URL("_funktion.css", DIR), "utf8"));
  const designs = readdirSync(DIR)
    .filter((f) => f.endsWith(".css") && !f.startsWith("_"))
    .map((f) => {
      const roh = readFileSync(new URL(f, DIR), "utf8");
      const id = f.replace(/\.css$/, "");
      if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`designs/${f}: Dateiname nur aus a-z, 0-9 und Bindestrich`);
      const kopf = roh.match(/^\s*\/\*([\s\S]*?)\*\//)?.[1] ?? "";
      const tag = (k) => kopf.match(new RegExp(`@${k}\\s+(.+)`))?.[1].trim();
      const name = tag("name");
      if (!name) throw new Error(`designs/${f}: im Kopfkommentar fehlt @name`);
      const css = strip(roh);
      if (!css.startsWith(":root{")) throw new Error(`designs/${f}: das CSS muss mit :root{ beginnen (Variablen)`);
      return {
        id, name,
        beschreibung: tag("beschreibung") ?? "",
        farben: (tag("farben") ?? "").split(/\s+/).filter(Boolean),
        reihenfolge: Number(tag("reihenfolge") ?? 99),
        css,
      };
    })
    .sort((a, b) => a.reihenfolge - b.reihenfolge || a.id.localeCompare(b.id));
  if (!designs.some((d) => d.id === "klassisch")) throw new Error("designs/klassisch.css fehlt (Standard und Referenz für den Prompt)");
  return { funktion, designs };
}

const istHauptskript = import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (istHauptskript) {
  const { funktion, designs } = ladeDesigns();
  const ts = `// AUTOMATISCH ERZEUGT aus designs/*.css durch scripts/build-designs.mjs, nicht von Hand ändern.

export const FUNKTION_CSS = ${JSON.stringify(funktion)};

export const DESIGN_DATEIEN = ${JSON.stringify(designs.map(({ reihenfolge, ...d }) => d), null, 2)} as const;
`;
  writeFileSync(OUT, ts);
  console.log(`Designs übernommen: ${designs.map((d) => d.id).join(", ")}`);
}
