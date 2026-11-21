// Designs für Lernseiten (Variante A: nur CSS, Struktur gleich). Quelle: designs/*.css, übersetzt durch
// scripts/build-designs.mjs nach lib/designs.generated.ts. Eingesetzt wird immer Design + Funktionsregeln
// in den Block <style id="lw-basis">; nur Seiten mit diesem Block lassen sich nachträglich umstellen.
import { DESIGN_DATEIEN, FUNKTION_CSS } from "./designs.generated";

export type DesignId = (typeof DESIGN_DATEIEN)[number]["id"];
export type Design = { id: DesignId; name: string; beschreibung: string; farben: readonly string[] };

export const STANDARD_DESIGN: DesignId = "klassisch";

/** Alle Designs in der Reihenfolge der Auswahl, ohne CSS. */
export const DESIGNS: Design[] = DESIGN_DATEIEN.map(({ id, name, beschreibung, farben }) => ({ id, name, beschreibung, farben }));

export function istDesign(v: unknown): v is DesignId {
  return DESIGN_DATEIEN.some((d) => d.id === v);
}

/** CSS für den Block lw-basis: Design zuerst, Funktionsregeln danach (gewinnen bei Gleichstand). */
export function designCss(id: string = STANDARD_DESIGN): string {
  const d = DESIGN_DATEIEN.find((x) => x.id === id) ?? DESIGN_DATEIEN.find((x) => x.id === STANDARD_DESIGN)!;
  return `${d.css}\n${FUNKTION_CSS}`;
}

const BLOCK = /<style\s+id=["']lw-basis["'][^>]*>[\s\S]*?<\/style>/i;

/** Hat die Seite den austauschbaren Design-Block? (Seiten vor dem 31.10.2026 haben ihr eigenes CSS.) */
export function designWechselbar(html: string): boolean {
  return BLOCK.test(html);
}

/** Design-Karte anbieten: vorerst nur Lernseiten (params.typ fehlt oder «lernseite») mit austauschbarem Block. */
export function designWaehlbar(page: { html: string; params: Record<string, unknown> }): boolean {
  const typ = (page.params as { typ?: string })?.typ ?? "lernseite";
  return typ === "lernseite" && designWechselbar(page.html) && DESIGNS.length > 1;
}

/** Für die Auslieferung: Design der Seite einsetzen (pages.design); ohne Design oder Block unverändert. */
export function mitSeitenDesign(html: string, design: string | null): string {
  return design && istDesign(design) ? mitDesign(html, design) : html;
}

/** Tauscht das Design einer fertigen Seite aus; ohne Block bleibt die Seite unverändert. */
export function mitDesign(html: string, id: string): string {
  if (!designWechselbar(html)) return html;
  const neu = html.replace(BLOCK, () => `<style id="lw-basis">\n${designCss(id)}\n</style>`);
  return DESIGN_DATEIEN.find((d) => d.id === id)?.dunkel ? fuerDunkel(neu) : neu;
}

// Alle <style>-Blöcke ausser lw-basis, also das eigene CSS, das die KI pro Seite schreibt
const EIGENES_CSS = /(<style\b(?![^>]*\bid=["']lw-basis["'])[^>]*>)([\s\S]*?)(<\/style>)/gi;

/**
 * Für dunkle Designs: Im eigenen CSS der Seite trägt die KI manchmal feste helle Hintergründe oder dunkle
 * Schrift ein (z. B. background:#fff). Auf dunklem Grund wäre das unlesbar, darum werden sie bei der
 * Auslieferung durch die Variablen ersetzt. Gespeichert bleibt die Seite unverändert; in Grafiken
 * (.viz, svg) gelten ohnehin die hellen Farben, dort ändert sich dadurch nichts.
 */
function fuerDunkel(html: string): string {
  return html.replace(EIGENES_CSS, (_, auf: string, css: string, zu: string) =>
    auf +
    css
      .replace(/(^|[;{\s])(background(?:-color)?\s*:\s*)(#fff(?:fff)?|white)\b/gi, "$1$2var(--card)")
      .replace(/(^|[;{\s])(color\s*:\s*)(#1E3246|#000(?:000)?|black)\b/gi, "$1$2var(--ink)") +
    zu
  );
}
