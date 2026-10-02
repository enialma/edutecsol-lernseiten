// Prompt-Baukasten – portiert aus public/prompt-generator-v2.html (gleiche Achsen, gleiche Textbausteine).
// Unterschied: Ausgabe ist immer genau eine HTML-Datei (kein Word/PDF), da der Server die Seite direkt speichert.

export type Diffart = "niveau" | "lerntyp" | "interesse" | "sozialform";
export type Sprache = "standard" | "einfach" | "glossar" | "zweisprachig";
export type Twist = "auto" | "ausreisser" | "vergleich" | "grenzfall" | "fehler" | "methoden" | "transfer";
export type Niveau = "reproduzieren" | "anwenden" | "beurteilen";

export type GenParams = {
  fach: string;
  stufe: string;
  thema?: string;
  extra?: string;
  diffart: Diffart;
  anzahl: 2 | 3 | 4;
  sprache: Sprache;
  zweitsprache?: string;
  twist: Twist;
  niveau: Niveau;
};

export const DIFFART_LABELS: Record<Diffart, string> = {
  niveau: "nach Niveau (Hilfe)",
  lerntyp: "nach Lerntyp",
  interesse: "nach Berufsfeld",
  sozialform: "nach Sozialform",
};
export const SPRACHE_LABELS: Record<Sprache, string> = {
  standard: "Standard",
  einfach: "vereinfachte Sprache",
  glossar: "Fachbegriffe mit Glossar",
  zweisprachig: "Schlüsselbegriffe zweisprachig",
};
export const TWIST_LABELS: Record<Twist, string> = {
  auto: "passend wählen",
  ausreisser: "Ausreisser/Robustheit",
  vergleich: "Fälle vergleichen",
  grenzfall: "Grenzfall",
  fehler: "Fehler erkennen",
  methoden: "Methoden vergleichen",
  transfer: "Transfer/Anwendung",
};
export const NIVEAU_LABELS: Record<Niveau, string> = {
  reproduzieren: "reproduzieren",
  anwenden: "anwenden",
  beurteilen: "beurteilen",
};

export const PRESETS: Record<string, Partial<GenParams> & { label: string }> = {
  mathe: { label: "Mathe BM", fach: "Mathematik", stufe: "Berufsmaturität", diffart: "niveau", anzahl: 3, sprache: "standard", twist: "auto", niveau: "anwenden" },
  pharma: { label: "Pharma-Rechnen", fach: "Pharma-Fachrechnen", stufe: "Pharma-Assistentinnen (FaGe/EFZ)", diffart: "niveau", anzahl: 3, sprache: "standard", twist: "fehler", niveau: "anwenden" },
  it: { label: "IT-Security", fach: "IT-Security", stufe: "Sek II / Berufsbildung", diffart: "niveau", anzahl: 3, sprache: "standard", twist: "fehler", niveau: "beurteilen" },
  daz: { label: "DaZ-Klasse", fach: "Mathematik", stufe: "Berufsvorbereitung", diffart: "niveau", anzahl: 3, sprache: "einfach", twist: "auto", niveau: "anwenden" },
};

function labelsFor(art: Diffart, n: number): string[] {
  const m: Record<Diffart, string[]> = {
    niveau: ["Mit Unterstützung", "Eigenständig", "Vertiefung", "Expert"],
    lerntyp: ["visuell/grafisch", "rechnerisch/formal", "sprachlich/erklärend", "handlungsorientiert"],
    interesse: ["Berufsfeld 1", "Berufsfeld 2", "Berufsfeld 3", "Berufsfeld 4"],
    sozialform: ["Einzelarbeit", "Partnerarbeit", "Gruppenauftrag", "Plenum"],
  };
  return m[art].slice(0, n);
}

function diffartText(p: GenParams): string {
  const n = p.anzahl;
  const L = labelsFor(p.diffart, n).map((x, i) => String.fromCharCode(65 + i) + " – " + x).join(", ");
  const map: Record<Diffart, string> = {
    niveau: `Differenziere nach NIVEAU (Umfang der Unterstützung). Alle Zugänge behandeln dieselbe Kernaufgabe und dieselben Erfolgskriterien; sie unterscheiden sich nur im Grad der Hilfe. Erstelle ${n} Zugänge: ${L}.`,
    lerntyp: `Differenziere nach LERNTYP: Alle Zugänge behandeln dieselbe Kernaufgabe auf gleichem Anforderungsniveau, aber über verschiedene Zugangskanäle. Erstelle ${n} Zugänge: ${L}. Jeder Zugang löst dieselbe Aufgabe, betont aber seinen Kanal (Grafik/Diagramm vs. Formel/Rechnung vs. sprachliche Erklärung vs. konkrete Handlung).`,
    interesse: `Differenziere nach BERUFSFELD/INTERESSE: dieselbe mathematische bzw. fachliche Kompetenz, eingebettet in unterschiedliche berufliche Kontexte. Erstelle ${n} Zugänge (${L}) und ersetze die Platzhalter-Berufsfelder durch zur Zielstufe passende Felder. Die Rechen-/Denkstruktur ist in allen Zugängen identisch, nur das Anwendungsbeispiel unterscheidet sich.`,
    sozialform: `Differenziere nach SOZIALFORM: dieselbe Kernaufgabe, aber unterschiedliche Bearbeitungsform. Erstelle ${n} Zugänge: ${L}. Formuliere je einen passenden Arbeitsauftrag (allein / zu zweit mit Rollen / in der Gruppe mit Teilaufgaben) und ergänze bei Partner-/Gruppenzugängen eine kurze Anleitung zur Zusammenarbeit.`,
  };
  return map[p.diffart];
}

function spracheText(p: GenParams): string {
  const map: Record<Sprache, string> = {
    standard: "",
    einfach: "SPRACHE: Verwende durchgehend vereinfachte Sprache (kurze Sätze, ein Gedanke pro Satz, wenig Nebensätze, klare Verben). Erkläre jeden Fachbegriff bei seiner ersten Verwendung in einfachen Worten.",
    glossar: "SPRACHE: Behalte die Fachsprache bei, ergänze aber ein aufklappbares Glossar mit allen Fachbegriffen und ihren Erklärungen in einfacher Sprache. Markiere Fachbegriffe im Text dezent.",
    zweisprachig: `SPRACHE: Führe die zentralen Schlüsselbegriffe zusätzlich in ${(p.zweitsprache ?? "").trim() || "einer zweiten Sprache"} auf (Fachbegriff Deutsch – Übersetzung), damit Lernende mit dieser Erstsprache den Inhalt sprachlich erschliessen können. Der übrige Text bleibt auf Deutsch.`,
  };
  return map[p.sprache];
}

function twistText(p: GenParams): string {
  const map: Record<Twist, string> = {
    auto: "Wähle einen zum Thema passenden Twist, der zusätzliche Denkarbeit verlangt statt nur mehr Aufgaben.",
    ausreisser: "Twist: Führe einen Ausreisser oder Extremwert ein und lass die Lernenden entdecken, welche Grössen robust bleiben und welche sich stark verändern.",
    vergleich: "Twist: Lass mehrere Fälle vergleichen, die trotz unterschiedlicher Zahlen zum gleichen Ergebnis (oder Muster) führen, und die dahinterliegende Regel erkennen.",
    grenzfall: "Twist: Konfrontiere die Lernenden mit einem Grenz- oder Sonderfall, der die einfache Regel herausfordert und eine differenzierte Begründung verlangt.",
    fehler: "Twist: Baue bewusst fehlerhafte Ergebnisse oder Aussagen ein, die die Lernenden als falsch erkennen und begründen müssen (Fehlersuche/Plausibilitätsprüfung).",
    methoden: "Twist: Stelle der gelernten Methode eine alternative Methode gegenüber und lass Vor-/Nachteile sowie die Wahl der passenden Methode begründen.",
    transfer: "Twist: Verlange den Transfer auf eine neue, berufsnahe Situation, in der die Lernenden das Verfahren eigenständig anwenden und die Anwendbarkeit beurteilen.",
  };
  return "VERTIEFUNG (oberster Zugang): " + map[p.twist] + " Ergänze eine Begründungsfrage und eine Transferfrage in den Berufskontext sowie einen Button, der den Kernzusammenhang sichtbar macht (Aha-Moment).";
}

function niveauText(p: GenParams): string {
  const map: Record<Niveau, string> = {
    reproduzieren: "ANFORDERUNGSNIVEAU: Zielebene «reproduzieren/anwenden» – Verfahren korrekt ausführen und auf gleichartige Aufgaben übertragen. Formuliere die Erfolgskriterien entsprechend.",
    anwenden: "ANFORDERUNGSNIVEAU: Zielebene «anwenden» – das Verfahren in einer sinnvollen Situation selbstständig und mit Begründung anwenden. Formuliere die Erfolgskriterien entsprechend.",
    beurteilen: "ANFORDERUNGSNIVEAU: Zielebene «beurteilen» – Ergebnisse und Methoden bewerten, vergleichen und die Wahl begründen. Hebe im obersten Zugang die Urteils- und Begründungskompetenz hervor.",
  };
  return map[p.niveau];
}

/** System-Prompt: Rolle + Ausgabe-Vertrag (stabil, cachebar). */
export function systemPrompt(): string {
  return `Du erstellst differenzierte, interaktive Lernseiten für die Schweizer Berufsbildung.

AUSGABE-VERTRAG (zwingend):
- Antworte ausschliesslich mit einer einzigen, vollständigen HTML-Datei: beginne mit <!DOCTYPE html> und ende mit </html>.
- Kein Text davor oder danach, keine Markdown-Codezäune, keine Erklärungen ausserhalb der Datei.
- Die Datei ist in sich geschlossen: alles CSS und JavaScript inline, keine externen Abhängigkeiten, offline lauffähig.
- Sprache: Schweizer Standarddeutsch (kein ß).
- Setze im <head> ein <title> mit dem Thema und ein <meta name="description"> mit einer Zeile zur Kernaufgabe.
- Struktur für den Druck: jeder Zugang ist ein eigenes Element mit role="tabpanel"; der Lehrpersonen-Bereich ist ein <details class="lehrperson">. Der PDF-Button öffnet vor window.print() alle Zugänge und alle <details> und setzt sie danach zurück. Druck-CSS: @page { size: A4 portrait; margin: 14mm }, Bedienelemente ausgeblendet, jeder Zugang beginnt auf einer neuen Seite, keine farbigen Hintergrundflächen, keine Seitenumbrüche innerhalb von Aufgaben oder Grafiken.
- Die abschliessende Notiz (gewähltes Thema, Differenzierungsart, Twist) gehört in einen HTML-Kommentar direkt vor </html>: <!-- NOTIZ: ... -->`;
}

/** User-Prompt aus den Achsen + Material. */
export function userPrompt(p: GenParams, material: { name?: string; text: string } | null): string {
  const fach = p.fach.trim() || "[Fach/Kontext]";
  const stufe = p.stufe.trim() || "[Zielstufe]";
  const thema = (p.thema ?? "").trim();
  const extra = (p.extra ?? "").trim();
  const hasMaterial = !!material && material.text.trim().length > 0;

  const themaLine = thema
    ? `- Thema: ${thema}`
    : hasMaterial
      ? "- Thema: leer – wähle das geeignetste Thema selbst aus dem Material"
      : "- Thema: leer – leite ein geeignetes Thema aus Fach und Stufe ab";
  const extraLine = extra ? `\n- Zusatzwunsch: ${extra}` : "";
  const dateiLine = hasMaterial
    ? `- Material: ${material?.name ? `«${material.name}», ` : ""}Textauszug unten`
    : "- Material: keine Datei – arbeite allein mit den Angaben oben";
  const aufgabeText = hasMaterial
    ? "Lies das Material unten, wähle das didaktisch geeignetste Thema für eine differenzierte Übung (sofern oben keines vorgegeben ist) und erstelle daraus eine interaktive Lernseite. Enthält das Material konkreten Aufgabentext oder Daten, verwende diese; fehlt auslesbarer Inhalt, wähle ein fachlich stimmiges, alltagsnahes Beispiel und vermerke das in der Notiz."
    : "Erstelle aus den Angaben oben eine differenzierte, interaktive Lernseite. Wähle – sofern kein Thema vorgegeben ist – ein geeignetes Thema und ein fachlich stimmiges, alltagsnahes Beispiel; vermerke in der Notiz, dass kein Material vorlag.";
  const spr = spracheText(p);

  const materialBlock = hasMaterial
    ? `\n\n§MATERIAL (Textauszug)\n<<<\n${material!.text.trim()}\n>>>`
    : "";

  return `§ROLLE
Du bist Fachdidaktiker:in für ${fach} auf der Stufe ${stufe} und Frontend-Entwickler:in.

§ANGABEN
- Fach/Kontext: ${fach}
- Zielstufe: ${stufe}
${themaLine}${extraLine}
${dateiLine}

§AUFGABE
${aufgabeText}

§KOMPETENZZIEL & KERNAUFGABE
Leite ein präzises Kompetenzziel ab. Formuliere eine Kernaufgabe mit (1) Berechnung/Bestimmung, (2) nachvollziehbarem Rechen-/Begründungsweg und (3) einem sachlichen Ergebnissatz. Definiere die Erfolgskriterien.
${niveauText(p)}

§DIFFERENZIERUNG
${diffartText(p)}
- Die Lernenden bearbeiten nur ihren gewählten Zugang (per Reiter-Klick).
- Erster/einfachster Zugang «Mit Unterstützung»: kurze Erklärung der Fachbegriffe; ein Rechen- bzw. Zuordnungsrahmen zum Ausfüllen (interaktiv mit grünem Häkchen bei korrekter und einem Hinweis bei falscher Eingabe, ohne die Lösung zu verraten); drei Leitfragen; ein Satzanfang für den Ergebnissatz. Weder Rechnung noch Ergebnis vollständig nennen.
- Mittlerer Zugang «Eigenständig»: gleiche Kernaufgabe ohne Hilfen; Möglichkeit zur Ergebnisprüfung; Selbstcheck-Liste mit vier abhakbaren Fragen.
- ${twistText(p)}
${spr ? "\n§" + spr + "\n" : ""}
§AUSGABEFORMAT – INTERAKTIVE WEBSITE
Eine einzige, voll funktionsfähige HTML-Seite (eine Datei, ohne externe Abhängigkeiten, offline lauffähig):
- Zugangswahl per Klick (Reiter): die Lernenden sehen nur ihren gewählten Zugang.
- Visualisierung der Kernaufgabe als durchgehende Leitidee, passend zum Thema. Jedes Eingabefeld ist sichtbar beschriftet, damit klar ist, wohin es gehört; optionale Hilfslinien/Marker erscheinen erst nach korrekter Eingabe.
- Interaktive Selbstkontrolle: Eingabefelder/Auswahlbuttons zeigen bei korrekter Eingabe ein grünes Häkchen, bei falscher einen Hinweis, ohne die Lösung zu verraten.
- Bereich «Für die Lehrperson»: ausklappbar (verborgen bis Klick), mit vollständigen Lösungen und Wegen, getrennt vom Aufgabenteil; ein Satz zum didaktischen Anschluss.
- PDF-Button oben («Als PDF herunterladen»): blendet für den Export alle Zugänge und den Lehrpersonen-Bereich ein und löst den Druckdialog aus; eigene @media-print-CSS blendet Reiter/Buttons aus; Fallback, der die Seite in einem neuen Tab öffnet, falls der Druckdialog blockiert ist.

§GESTALTUNG
Ruhiges, altersgerechtes Design für die Zielstufe; themenpassende Visualisierung als Leitidee; responsiv bis Mobile, Tastaturbedienbarkeit, sichtbarer Fokus. Keine generische KI-Optik (keine cremefarbenen Hintergründe, keine Akzentstreifen).

§QUALITÄTSPRÜFUNG VOR DER AUSGABE
- Rechne alle Lösungen selbst nach; die Feedback-Logik jedes Eingabefelds muss exakt zu den richtigen Werten passen.
- Prüfe, dass jede Aufgabe klar zeigt, was wo einzutragen ist (welche Eingabe welche Visualisierung auslöst).
- Kontrolliere alle Texte (auch Selbstchecks) auf Tipp- und Flüchtigkeitsfehler.
- Schweizer Standarddeutsch; Selbstcheck-Listen abhakbar.${materialBlock}`;
}

/** Zieht die reine HTML-Datei aus einer Modellantwort (entfernt Codezäune und Text ausserhalb). */
export function extractHtml(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence && fence[1].includes("<html")) s = fence[1].trim();
  const start = s.search(/<!doctype html/i);
  const i = start >= 0 ? start : s.search(/<html[\s>]/i);
  if (i > 0) s = s.slice(i);
  const end = s.lastIndexOf("</html>");
  if (end >= 0) s = s.slice(0, end + 7);
  return s;
}

/** Titel aus <title> oder Fallback. */
export function titleFromHtml(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const t = (m?.[1] ?? "").replace(/\s+/g, " ").trim();
  return t || fallback;
}
