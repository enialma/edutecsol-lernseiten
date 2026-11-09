// Prompt-Baukasten – portiert aus public/prompt-generator-v2.html (gleiche Achsen, gleiche Textbausteine).
// Unterschied: Ausgabe ist immer genau eine HTML-Datei (kein Word/PDF), da der Server die Seite direkt speichert.

import { designBasisPrompt } from "./design-basis";
import { DIFFART_WAHL, EIGEN_PREFIX, SOZIALFORMEN, alteZugaenge, defaultZugaenge, zugangOptionen, type DiffartWahl, type Sozialform } from "./achsen";

/** «sozialform» gibt es nur noch in alten gespeicherten Seiten; neu ist die Sozialform eine eigene Achse (sozialformen). */
export type Diffart = DiffartWahl | "sozialform";
export type Sprache = "standard" | "einfach" | "glossar" | "zweisprachig";
export type Twist = "auto" | "ausreisser" | "vergleich" | "grenzfall" | "fehler" | "methoden" | "transfer";
export type Niveau = "reproduzieren" | "anwenden" | "beurteilen";
/** Seitentyp: klassische Lernseite oder Prüfungsvorbereitung (weitere Typen folgen). */
export type Typ = "lernseite" | "arbeitsblatt" | "pruefung" | "spiel" | "hilfe";
export type Dauer = 20 | 30 | 45;

export type GenParams = {
  /** Seitentyp; fehlt bei älteren Seiten = Lernseite. */
  typ?: Typ;
  /** Nur Prüfungsvorbereitung: Dauer der Übungsprüfung in Minuten. */
  dauer?: Dauer;
  fach: string;
  stufe: string;
  thema?: string;
  extra?: string;
  diffart: Diffart;
  /** Nur alte Seiten: Anzahl Zugänge 2–4 (heute über zugaenge gewählt). */
  anzahl?: 2 | 3 | 4;
  /** Nur Lernseite: gewählte Zugänge in Skalen-Reihenfolge, eigene Berufsfelder als «eigen:Name». */
  zugaenge?: string[];
  /** Nur Lernseite, nur bei Berufsfeld: eigene Felder (max. 4 × 60 Zeichen). */
  eigeneBerufsfelder?: string[];
  /** Nur Lernseite: mindestens eine Sozialform; mehrere = Umschalter auf der Seite. */
  sozialformen?: Sozialform[];
  sprache: Sprache;
  zweitsprache?: string;
  twist: Twist;
  niveau: Niveau;
  /** Optional: ein direkt erzeugtes Bild, das die Lernseite als Bildaufgabe einbindet. */
  bild?: { id: number; url: string; title: string; auftrag: string; alt: string };
  /** Nur Lernseite: Anzahl Aufgaben pro Zugang (1–12); fehlt = KI entscheidet. */
  aufgaben?: number;
  /** Nur Lernseite: Vorgaben der Lehrperson zu den Aufgaben (max. 2 000 Zeichen). */
  aufgabenText?: string;
  /** Nur Lernseite: Formeln in LaTeX-Notation, auf der Seite als MathML gesetzt. */
  latex?: boolean;
};

export const TYP_LABELS: Record<Typ, string> = {
  lernseite: "Lernseite",
  arbeitsblatt: "Arbeitsblatt",
  pruefung: "Prüfungsvorbereitung",
  spiel: "Lernspiel",
  hilfe: "Lernhilfe",
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
  mathe: { label: "Mathe BM", fach: "Mathematik", stufe: "Berufsmaturität", diffart: "niveau", zugaenge: defaultZugaenge("niveau"), sozialformen: ["einzel"], sprache: "standard", twist: "auto", niveau: "anwenden" },
  pharma: { label: "Pharma-Rechnen", fach: "Pharma-Fachrechnen", stufe: "Pharma-Assistentinnen (FaGe/EFZ)", diffart: "niveau", zugaenge: defaultZugaenge("niveau"), sozialformen: ["einzel"], sprache: "standard", twist: "fehler", niveau: "anwenden" },
  it: { label: "IT-Security", fach: "IT-Security", stufe: "Sek II / Berufsbildung", diffart: "niveau", zugaenge: defaultZugaenge("niveau"), sozialformen: ["einzel"], sprache: "standard", twist: "fehler", niveau: "beurteilen" },
  daz: { label: "DaZ-Klasse", fach: "Mathematik", stufe: "Berufsvorbereitung", diffart: "niveau", zugaenge: defaultZugaenge("niveau"), sozialformen: ["einzel"], sprache: "einfach", twist: "auto", niveau: "anwenden" },
};

/** Achsen einer Lernseite, auch für alte Seiten (anzahl, Sozialform als Differenzierungsart) – für Prompt und Anzeige. */
export function normalizeLernseite(p: Partial<GenParams>): { diffart: DiffartWahl; zugaenge: string[]; eigeneBerufsfelder: string[]; sozialformen: Sozialform[] } {
  const alteSozialform = p.diffart === "sozialform";
  const diffart: DiffartWahl = p.diffart && (DIFFART_WAHL as string[]).includes(p.diffart) ? (p.diffart as DiffartWahl) : "niveau";
  const eigene = diffart === "interesse" ? (p.eigeneBerufsfelder ?? []) : [];
  const erlaubt = zugangOptionen(diffart, eigene).map((o) => o.v);
  let zugaenge = (p.zugaenge ?? []).filter((v) => erlaubt.includes(v));
  if (!zugaenge.length) zugaenge = alteSozialform || !p.anzahl ? alteZugaenge(diffart) : erlaubt.slice(0, p.anzahl);
  // Alte Seiten «nach Sozialform»: die ersten n Sozialformen werden zu Varianten auf einer Niveau-Seite
  const sozialformen: Sozialform[] = p.sozialformen?.length
    ? SOZIALFORMEN.map((o) => o.v).filter((v) => p.sozialformen!.includes(v))
    : alteSozialform ? SOZIALFORMEN.slice(0, p.anzahl ?? 3).map((o) => o.v) : ["einzel"];
  return { diffart, zugaenge, eigeneBerufsfelder: eigene, sozialformen };
}

const DIFF_KOPF: Record<DiffartWahl, { label: string; intro: string }> = {
  niveau: { label: "NIVEAU (Umfang der Unterstützung)", intro: "Alle Zugänge behandeln dieselbe Kernaufgabe und dieselben Erfolgskriterien; sie unterscheiden sich nur im Grad der Hilfe." },
  lerntyp: { label: "LERNTYP (Zugangskanal)", intro: "Alle Zugänge behandeln dieselbe Kernaufgabe auf gleichem Anforderungsniveau; sie unterscheiden sich nur im Kanal, über den die Aufgabe erschlossen wird." },
  interesse: { label: "BERUFSFELD/INTERESSE", intro: "Alle Zugänge trainieren dieselbe fachliche Kompetenz mit identischer Lösungs- bzw. Denkstruktur; nur das berufliche Anwendungsbeispiel unterscheidet sich. Wähle innerhalb jedes Berufsfelds ein Beispiel, das zur Zielstufe passt." },
};

// Beschreibung je Zugang für den Prompt (nur für gewählte Zugänge verwendet)
const ZUGANG_PROMPT: Record<string, string> = {
  unterstuetzt: "kurze Erklärung der Fachbegriffe; ein Lösungs- bzw. Zuordnungsrahmen zum Ausfüllen (mit Selbstkontrolle wie unter AUSGABEFORMAT beschrieben); drei Leitfragen; ein Satzanfang für den Ergebnissatz. Weder Lösungsweg noch Ergebnis vollständig nennen.",
  eigenstaendig: "gleiche Kernaufgabe ohne Hilfen; Möglichkeit zur Ergebnisprüfung; Selbstcheck-Liste mit vier abhakbaren Fragen.",
  vertiefung: "Kernaufgabe ohne Hilfen, erweitert um den Twist (siehe TWIST); eine Begründungsfrage und eine Transferfrage in den Berufskontext; ein Button, der den Kernzusammenhang sichtbar macht (Aha-Moment).",
  expert: "offene, komplexere Problemstellung zur gleichen Kernaufgabe ohne vorgegebenen Lösungsweg; die Lernenden wählen und begründen ihr Vorgehen selbst, auf der gewählten Zielebene.",
  visuell: "die Aufgabe wird über Grafik, Diagramm oder Skizze erschlossen; die Lernenden lesen ab, zeichnen ein oder ordnen zu.",
  rechnerisch: "die Aufgabe wird über Formel, Tabelle, Schema oder einen schrittweisen Lösungsweg erschlossen.",
  sprachlich: "die Aufgabe wird über Text erschlossen; die Lernenden erklären Vorgehen und Ergebnis in eigenen Worten und begründen es.",
  handlung: "die Aufgabe wird über eine konkrete Handlung oder Simulation erschlossen, Schritt für Schritt wie im Berufsalltag.",
  gesundheit: "Beispiel aus Pflege, Arztpraxis, Apotheke oder Betreuung.",
  technik: "Beispiel aus Werkstatt, Bau, Elektro oder Informatik.",
  wirtschaft: "Beispiel aus Büro, Buchhaltung oder Logistik.",
  handel: "Beispiel aus Detailhandel, Gastronomie oder Kundenkontakt.",
};

const SOZIALFORM_PROMPT: Record<Sozialform, string> = {
  einzel: "jede Person bearbeitet die Aufgaben allein; Arbeitsaufträge in der Du-Form, Selbstkontrolle individuell.",
  partner: "zu zweit mit klaren Rollen (z. B. eine Person löst, die andere kontrolliert, nach jeder Teilaufgabe wechseln); kurze Anleitung zur Zusammenarbeit und ein gemeinsamer Ergebnissatz.",
  gruppe: "in Gruppen von drei bis vier Personen mit verteilten Teilaufgaben und Rollen; Anleitung zur Zusammenarbeit und ein gemeinsames Ergebnis, das die Gruppe vorstellt.",
  plenum: "gemeinsam mit der ganzen Klasse, von der Lehrperson geführt; Aufgaben in Etappen mit Diskussionsfragen und kurzen Abstimmungen, gut lesbar für die Projektion. Bei mehreren Zugängen wählt die Lehrperson im Plenum einen Zugang für alle oder bespricht die Zugänge nacheinander.",
};

function diffartText(p: GenParams): string {
  const blatt = p.typ === "arbeitsblatt";
  const a = normalizeLernseite(p);
  const alle = zugangOptionen(a.diffart, a.eigeneBerufsfelder);
  const gew = alle.filter((o) => a.zugaenge.includes(o.v));
  const rest = alle.filter((o) => !a.zugaenge.includes(o.v));
  const letter = (i: number) => String.fromCharCode(65 + i);
  const liste = gew.map((o, i) => `${letter(i)} – ${o.name}`).join(", ");
  const beschreibung = (o: { v: string; name: string }) => {
    const t = ZUGANG_PROMPT[o.v] ?? (o.v.startsWith(EIGEN_PREFIX) ? `Beispiel aus dem Berufsfeld «${o.name}».` : "");
    // Auf Papier: Platz zum Eintragen statt Selbstkontrolle, Merksatz statt Button
    return blatt ? t.replace("(mit Selbstkontrolle wie unter AUSGABEFORMAT beschrieben)", "(mit Platz zum Eintragen)").replace("ein Button, der den Kernzusammenhang sichtbar macht (Aha-Moment)", "ein Merksatz, der den Kernzusammenhang festhält") : t;
  };
  const aha = blatt ? "einen Merksatz, der den Kernzusammenhang festhält" : "einen Button, der den Kernzusammenhang sichtbar macht (Aha-Moment)";
  let twist: string;
  if (a.diffart === "niveau") {
    const hoch = gew.filter((o) => o.v === "vertiefung" || o.v === "expert");
    twist = hoch.length
      ? `- TWIST (in ${hoch.map((o) => `«${o.name}»`).join(" und ")}): ${twistText(p)}`
      : `- TWIST (als freiwillige Zusatzaufgabe am Schluss jedes gewählten Zugangs, ohne die Hilfen dort zu verringern): ${twistText(p)} Ergänze eine Begründungsfrage und ${aha}.`;
  } else {
    twist = `- Jeder Zugang: ${blatt ? "Selbstcheck-Liste mit vier ankreuzbaren Fragen; drei Leitfragen in einem Hinweiskasten" : "Möglichkeit zur Ergebnisprüfung; Selbstcheck-Liste mit vier abhakbaren Fragen; drei Leitfragen als aufklappbare Hilfe"}.
- TWIST (als Zusatzaufgabe am Schluss jedes Zugangs): ${twistText(p)} Ergänze eine Begründungsfrage und eine Transferfrage in den Berufskontext sowie ${aha}.`;
  }
  const ordnung = a.diffart === "niveau"
    ? `- Die Zugänge sind gestuft, von «${gew[0].name}» (meiste Hilfe) bis «${gew[gew.length - 1].name}» (anspruchsvollster gewählter Zugang). Wo die Designbasis vom «obersten Zugang» spricht, ist «${gew[gew.length - 1].name}» gemeint; die Zielebene unter ANFORDERUNGSNIVEAU gilt für alle Zugänge.`
    : `- Die Zugänge sind gleichwertig und nicht gestuft: es gibt keinen obersten, untersten oder einfachsten Zugang. Bezeichne sie nur mit Buchstabe und Name (z. B. «Zugang A · ${gew[0].name}»), ohne Wörter wie «Mit Unterstützung», «Vertiefung» oder «Expert». Wo die Designbasis vom «obersten Zugang» spricht, gilt das hier für jeden Zugang.`;
  return [
    `Gewählt (${gew.length === 1 ? "1 Zugang" : `${gew.length} Zugänge`}): ${liste}.`,
    `Differenziere nach ${DIFF_KOPF[a.diffart].label}. ${DIFF_KOPF[a.diffart].intro}`,
    ...gew.map((o, i) => `- ${letter(i)} – ${o.name}: ${beschreibung(o)}`),
    ...rest.map((o) => `- Nicht erstellen, nur zur Abgrenzung: ${o.name} (${o.info.replace(/\.$/, "")}).`),
    blatt
      ? (gew.length === 1 ? "- Es gibt nur diesen einen Zugang, ohne Aufteilung." : "- Jeder Zugang ist ein eigener, klar beschrifteter Abschnitt; die Lernenden bearbeiten nur ihren Abschnitt.")
      : gew.length === 1
        ? `- Es gibt nur diesen einen Zugang: die Reiterleiste bleibt wie im Grundgerüst, mit genau einem Reiter, der beim Öffnen bereits aktiv ist (Klasse active, aria-selected="true"); sein Panel ist sofort sichtbar (Klasse show).`
        : "- Die Lernenden bearbeiten nur ihren gewählten Zugang (per Reiter-Klick).",
    gew.length > 1 || a.diffart !== "niveau" ? ordnung : "",
    twist,
  ].filter(Boolean).join("\n");
}

/** Kopfzeile des Arbeitsblatts: «Zugang: ☐ A ☐ B …» bei mehreren Zugängen. */
function gewLetters(p: GenParams): string {
  const n = normalizeLernseite(p).zugaenge.length;
  return n > 1 ? "  Zugang: " + Array.from({ length: n }, (_, i) => "☐ " + String.fromCharCode(65 + i)).join(" ") : "";
}

function sozialformText(p: GenParams): string {
  const blatt = p.typ === "arbeitsblatt";
  const { sozialformen } = normalizeLernseite(p);
  const gew = SOZIALFORMEN.filter((o) => sozialformen.includes(o.v));
  const rest = SOZIALFORMEN.filter((o) => !sozialformen.includes(o.v));
  const auftrag = gew.length === 1
    ? `Formuliere alle Arbeitsaufträge für ${gew[0].name}; das gilt für alle Zugänge.`
    : `Erstelle die Arbeitsaufträge in ${gew.length} Versionen: ${gew.map((o) => o.name).join(", ")}. Das gilt für jeden Zugang; Kernaufgabe, Daten und Lösungen bleiben in allen Versionen gleich, nur Arbeitsauftrag und Zusammenarbeit unterscheiden sich.
${blatt ? `- Aufgaben je Zugang nur einmal; darunter die Arbeitsaufträge der Sozialformen als kurze Kästen, jeder mit einer Zwischenüberschrift (z. B. <h4>${gew[1].name}</h4>).` : `- In jedem Zugang oben ein Umschalter für die Sozialform (Knöpfe .choices/.choice aus der Designbasis, aktive Sozialform mit Klasse on), der nur den passenden Arbeitsauftrag zeigt.
- Blende nicht gewählte Versionen mit dem Attribut hidden aus (nicht per CSS-Klasse) und beginne jede Version mit einer sichtbaren Zwischenüberschrift (z. B. <h4>${gew[1].name}</h4>), damit Druck/PDF und Word-Export alle Versionen beschriftet zeigen.`}`;
  return [
    `Gewählt: ${gew.map((o) => o.name).join(", ")}.`,
    ...gew.map((o) => `- ${o.name}: ${SOZIALFORM_PROMPT[o.v]}`),
    rest.length ? `Nicht erstellen: ${rest.map((o) => o.name).join(", ")}.` : "",
    auftrag,
  ].filter(Boolean).join("\n");
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
  // Die Zeile im Prompt beginnt schon mit «TWIST», daher ohne das «Twist: » der Textbausteine
  return map[p.twist].replace(/^Twist: /, "");
}

// Aufgabenanzahl, Vorgaben der Lehrperson und Klarheitsregeln – übernommen aus dem Prompt-Generator
function aufgabenText(p: GenParams): string {
  const n = p.aufgaben;
  const anzahl = n && n >= 1 && n <= 12
    ? `- Jeder Zugang enthält genau ${n} ${n === 1 ? "Aufgabe" : "Aufgaben"} (die Kernaufgabe mitgezählt); der Twist kommt zusätzlich dazu.`
    : "";
  const vorgabe = (p.aufgabenText ?? "").trim()
    ? `- Vorgaben der Lehrperson zu den Aufgaben (haben Vorrang vor dem Material; passe sie je Zugang an, ohne den Inhalt zu ändern):\n<<<\n${p.aufgabenText!.trim()}\n>>>`
    : "";
  return [
    anzahl,
    vorgabe,
    "- Jede Aufgabe sagt eindeutig, was gesucht ist, in welcher Form die Antwort erwartet wird (z. B. Zahl mit Einheit, Satz, Auswahl) und wie genau (z. B. auf zwei Dezimalstellen gerundet).",
    "- Kommen Formeln, Zeichen oder Abkürzungen vor, erkläre jedes Zeichen bei der ersten Verwendung mit Bedeutung und Einheit (z. B. «ρ = Dichte in g/cm³, m = Masse in g»); ein Zeichen bedeutet auf der ganzen Seite dasselbe.",
  ].filter(Boolean).join("\n");
}

// Formeln: MathML statt externer Bibliothek, damit die Seite offline läuft; LaTeX bleibt als annotation erhalten (Word-Export liest sie)
function latexText(p: GenParams): string {
  if (!p.latex) return "";
  const felder = p.typ === "arbeitsblatt"
    ? "Formeln erscheinen in Aufgabentext, Hinweisen und auf dem Lösungsblatt."
    : "Eingabefelder für Ergebnisse bleiben normale Eingabefelder; Formeln erscheinen in Aufgabentext, Hilfen und Lösungen.";
  return `\n\n§FORMELN (LaTeX)
Schreibe alle Formeln in LaTeX-Notation und setze sie sauber, nie als Bild.
- Ohne externe Bibliothek (offline): jede Formel als MathML (<math>), mit dem LaTeX-Quelltext in <annotation encoding="application/x-tex"> innerhalb von <semantics>.
- ${felder}`;
}

function niveauText(p: GenParams): string {
  const map: Record<Niveau, string> = {
    reproduzieren: "ANFORDERUNGSNIVEAU: Zielebene «reproduzieren» – Verfahren korrekt ausführen und auf gleichartige Aufgaben übertragen. Formuliere die Erfolgskriterien entsprechend.",
    anwenden: "ANFORDERUNGSNIVEAU: Zielebene «anwenden» – das Verfahren in einer sinnvollen Situation selbstständig und mit Begründung anwenden. Formuliere die Erfolgskriterien entsprechend.",
    beurteilen: "ANFORDERUNGSNIVEAU: Zielebene «beurteilen» – Ergebnisse und Methoden bewerten, vergleichen und die Wahl begründen. "
      + (normalizeLernseite(p).diffart === "niveau"
        ? "Hebe in den anspruchsvollsten gewählten Zugängen die Urteils- und Begründungskompetenz hervor."
        : "Hebe in jedem Zugang die Urteils- und Begründungskompetenz hervor."),
  };
  return map[p.niveau];
}

/** System-Prompt: Rolle + Ausgabe-Vertrag (stabil, cachebar; je Seitentyp eine Variante). */
export function systemPrompt(typ: Typ = "lernseite"): string {
  if (typ === "lernseite" || typ === "arbeitsblatt") return lernSystemPrompt(typ === "arbeitsblatt");
  return `Du erstellst differenzierte, interaktive Lernseiten für Schweizer Schulen, passend zur angegebenen Stufe.

AUSGABE-VERTRAG (zwingend):
- Antworte ausschliesslich mit einer einzigen, vollständigen HTML-Datei: beginne mit <!DOCTYPE html> und ende mit </html>.
- Kein Text davor oder danach, keine Markdown-Codezäune, keine Erklärungen ausserhalb der Datei.
- Die Datei ist in sich geschlossen: alles CSS und JavaScript inline, keine externen Abhängigkeiten, offline lauffähig.
- Sprache: Schweizer Standarddeutsch (kein ß).
- Setze im <head> ein <title> mit dem Thema und ein <meta name="description"> mit einer Zeile zur Kernaufgabe.
- Struktur für den Druck: jeder Zugang ist ein eigenes Element mit role="tabpanel"; der Lehrpersonen-Bereich ist ein <details class="lehrperson">. Der PDF-Button öffnet vor window.print() alle Zugänge und alle <details> und setzt sie danach zurück. Druck-CSS: @page { size: A4 portrait; margin: 14mm }, Bedienelemente ausgeblendet, jeder Zugang beginnt auf einer neuen Seite, Rahmen und Überschriften in den EDUTECSOL-Farben (Navy #1E3246, Terra #B84816, Ocker #F1A51A), keine grossflächigen farbigen Hintergründe, keine Seitenumbrüche innerhalb von Aufgaben oder Grafiken.
- Die abschliessende Notiz (gewähltes Thema, Differenzierungsart, Twist) gehört in einen HTML-Kommentar direkt vor </html>: <!-- NOTIZ: ... -->

${designBasisPrompt(typ)}`;
}

/** System-Prompt für Lernseite und Arbeitsblatt: feste Regeln, Gestaltung und Qualitätsprüfung (für jede Seite gleich). */
function lernSystemPrompt(blatt: boolean): string {
  return `Du erstellst ${blatt ? "differenzierte Arbeitsblätter zum Austeilen" : "differenzierte, interaktive Lernseiten"} für Schweizer Schulen, passend zur angegebenen Stufe.

AUSGABE-VERTRAG (zwingend):
- Antworte ausschliesslich mit einer einzigen, vollständigen HTML-Datei: beginne mit <!DOCTYPE html> und ende mit </html>. Kein Text davor oder danach, keine Markdown-Codezäune, keine Erklärungen ausserhalb der Datei.
- Die Datei ist in sich geschlossen: ${blatt ? "alles CSS inline, kein JavaScript nötig" : "alles CSS und JavaScript inline"}, keine externen Abhängigkeiten, offline lauffähig.
- Sprache: Schweizer Standarddeutsch (kein ß).
- Setze im <head> ein <title> mit dem Thema und ein <meta name="description"> mit einer Zeile zur Kernaufgabe.
- ${blatt
    ? "Struktur für Druck und Word-Export: jeder Zugang ist ein eigenes Element mit role=\"tabpanel\" und Klasse show; das Lösungsblatt ist ein <details class=\"lehrperson\">. Druck-CSS: @page { size: A4 portrait; margin: 14mm }, jeder Zugang und das Lösungsblatt beginnen auf einer neuen Seite, keine Seitenumbrüche innerhalb von Aufgaben oder Grafiken."
    : "Struktur für den Druck: jeder Zugang ist ein eigenes Element mit role=\"tabpanel\"; der Lehrpersonen-Bereich ist ein <details class=\"lehrperson\">. Der PDF-Button öffnet vor window.print() alle Zugänge und alle <details> und setzt sie danach zurück. Druck-CSS: @page { size: A4 portrait; margin: 14mm }, Bedienelemente ausgeblendet, jeder Zugang beginnt auf einer neuen Seite, keine Seitenumbrüche innerhalb von Aufgaben oder Grafiken."}
- Prüfe Lösungen${blatt ? "" : " und Feedback-Logik"} still für dich; Rechen- und Begründungswege erscheinen nur ${blatt ? "auf dem Lösungsblatt" : "im Lehrpersonen-Bereich"}.
- Die abschliessende Notiz gehört in einen HTML-Kommentar direkt vor </html>: <!-- NOTIZ: ... -->

GESTALTUNG:
${blatt
  ? "Halte dich an die DESIGNBASIS unten (Platzhalter für das CSS, Klassen); vom Grundgerüst entfallen Reiterleiste, «Wähle deinen Zugang» und der PDF-Knopf, ebenso alle Knöpfe und Eingabefelder mit Rückmeldung. Visualisierungen schlicht (SVG oder Tabelle, in den Farbvariablen), damit sie gedruckt und in Word lesbar bleiben; keine grossen farbigen Flächen, schwarz-weiss-tauglich."
  : "Halte dich an die DESIGNBASIS unten (Platzhalter für das CSS, Grundgerüst, Klassen). Eigenes CSS nur für die themenpassende Visualisierung der Kernaufgabe (SVG oder HTML, in den Farbvariablen). Responsiv bis Mobile, Tastaturbedienbarkeit, sichtbarer Fokus."}

QUALITÄTSPRÜFUNG VOR DER AUSGABE:
- Prüfe alle Lösungen selbst: Rechnungen nachrechnen, fachliche Aussagen auf Richtigkeit prüfen.${blatt ? " Die Lösungen auf dem Lösungsblatt müssen korrekt sein." : " Die Feedback-Logik jedes Eingabefelds muss exakt zu den richtigen Werten passen."}
- Prüfe, dass jede Aufgabe klar zeigt, was wo einzutragen ist${blatt ? " und genug Platz dafür bleibt" : " (welche Eingabe welche Visualisierung auslöst)"}.
- Kontrolliere alle Texte (auch Selbstchecks) auf Tipp- und Flüchtigkeitsfehler.
- Zum Schluss: Lies ${blatt ? "das ganze Arbeitsblatt (alle Zugänge und das Lösungsblatt)" : "die ganze Seite (alle Zugänge und den Lehrpersonen-Bereich)"} noch einmal vollständig durch und prüfe die fachliche Richtigkeit: Fakten, Fachbegriffe, Formeln, Zeichen, Einheiten und Zahlenwerte, und ob Aufgabe${blatt ? " und Lösung" : ", Lösung und Rückmeldung"} zueinander passen. Korrigiere jeden Fehler, bevor du ausgibst.

${designBasisPrompt("lernseite")}`;
}

/** User-Prompt aus den Achsen + Material. */
export function userPrompt(p: GenParams, material: { name?: string; text: string } | null): string {
  if ((p.typ ?? "lernseite") === "pruefung") return pruefungPrompt(p, material);
  if (p.typ === "spiel") return spielPrompt(p, material);
  if (p.typ === "hilfe") return hilfePrompt(p, material);
  // Arbeitsblatt: dieselben Achsen wie die Lernseite, aber papiergerecht statt interaktiv
  const blatt = p.typ === "arbeitsblatt";
  const produkt = blatt ? "ein differenziertes Arbeitsblatt zum Austeilen" : "eine differenzierte, interaktive Lernseite";
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
  const bildLine = p.bild ? `\n- Bild: «${p.bild.title}» (siehe §BILD)` : "";
  const bildBlock = p.bild
    ? `\n\n§BILD
${blatt ? "Das Arbeitsblatt" : "Die Lernseite"} bindet dieses Bild als Bildaufgabe ein. Genau so, ohne Änderung der Adresse, kein anderes Bild, kein Platzhalter:
<img src="${p.bild.url}" alt="${p.bild.alt.replace(/"/g, "'")}" style="width:100%;height:auto;border-radius:12px">
- Position: direkt nach dem Einstieg, vor den Zugängen${blatt ? "" : " (Reitern)"}, als Blickfang mit Bildunterschrift «KI-generierte Illustration, fiktive Szene».
- Arbeitsauftrag zum Bild, als erste Aufgabe in jedem Zugang passend zum Niveau angepasst: «${p.bild.auftrag}»
- Das Bild ersetzt keine Kernaufgabe; es dient als Einstieg, Beobachtungs- oder Transferaufgabe. Im Lehrpersonen-Bereich: ein Satz, was am Bild zu prüfen war.`
    : "";
  const dateiLine = hasMaterial
    ? `- Material: ${material?.name ? `«${material.name}», ` : ""}Textauszug unten`
    : "- Material: keine Datei – arbeite allein mit den Angaben oben";
  const hatThema = !!thema;
  const aufgabeText = hasMaterial
    ? `Lies das Material unten${hatThema ? "" : ", wähle daraus das didaktisch geeignetste Thema für eine differenzierte Übung"} und erstelle ${hatThema ? "zum angegebenen Thema" : "dazu"} ${produkt}. Enthält das Material konkreten Aufgabentext oder Daten, verwende diese; fehlt auslesbarer Inhalt, wähle ein fachlich stimmiges, alltagsnahes Beispiel.`
    : `Erstelle aus den Angaben oben ${produkt}${hatThema ? "" : " zu einem selbst gewählten, passenden Thema"}, mit einem fachlich stimmigen, alltagsnahen Beispiel.`;
  const notizExtra = [!hatThema && "warum du dieses Thema gewählt hast", hasMaterial ? "ob das Material auslesbaren Text enthielt" : "dass kein Material vorlag"].filter(Boolean).join(", ");
  const anschluss = /\.pptx$/i.test(material?.name ?? "") ? "an die nächsten Folien" : "an den weiteren Unterricht";
  // spracheText() teilen sich alle Seitentypen (mit Präfix «SPRACHE: »); hier als eigener Abschnitt
  const spr = spracheText(p).replace(/^SPRACHE: /, "");

  const materialBlock = hasMaterial
    ? `\n\n§MATERIAL (Textauszug)\n<<<\n${material!.text.trim()}\n>>>`
    : "";
  const tailBlock = bildBlock + materialBlock;

  return `§ROLLE
Du bist Fachdidaktiker:in für ${fach} auf der Stufe ${stufe} und Frontend-Entwickler:in.

§ANGABEN
- Fach/Kontext: ${fach}
- Zielstufe: ${stufe}
${themaLine}${extraLine}${bildLine}
${dateiLine}

§AUFGABE
${aufgabeText}

§KERNAUFGABE
Formuliere eine Kernaufgabe mit (1) Berechnung, Bestimmung oder fachlicher Analyse – je nach Fach –, (2) nachvollziehbarem Lösungs- bzw. Begründungsweg und (3) einem sachlichen Ergebnissatz. Definiere die Erfolgskriterien.
${niveauText(p)}

§AUFGABEN
${aufgabenText(p)}${latexText(p)}

§DIFFERENZIERUNG
${diffartText(p)}

§SOZIALFORM
${sozialformText(p)}
${spr ? "\n§SPRACHE\n" + spr + "\n" : ""}
${blatt ? `§AUSGABEFORMAT – ARBEITSBLATT
Gestaltet als klassisches Arbeitsblatt zum Austeilen – papiergerecht, nicht als interaktive Übung; es wird gedruckt oder als Word-Datei heruntergeladen:
- Kopf mit Fach, Thema und Erfolgskriterien; darunter eine Zeile «Name: ______  Datum: ______${gewLetters(p)}».
- Die Kernaufgabe, danach alle Zugänge untereinander: jeder Zugang als <section class="panel show" role="tabpanel"> mit Überschrift «Zugang A · …»; keine Reiterleiste, kein «Wähle deinen Zugang». Beim Druck beginnt jeder Zugang auf einer neuen Seite.
- Platz zum Bearbeiten: Schreiblinien oder leere Kästen statt Eingabefelder mit Rückmeldung; Selbstcheck-Listen als ankreuzbare Kästchen (☐).
- Hinweise und Leitfragen in .hint-Kästen; nichts aufklappbar ausser dem Lösungsblatt.
- Lösungsblatt für die Lehrperson als <details class="lehrperson"> mit vollständigen Lösungs- und Begründungswegen; ein Satz zum didaktischen Anschluss ${anschluss}. Beim Druck und im Word-Export steht es auf einer eigenen Seite.` : `§AUSGABEFORMAT – INTERAKTIVE WEBSITE
Eine einzige, voll funktionsfähige HTML-Seite:
- Zugangswahl per Klick (Reiter, wie unter DIFFERENZIERUNG beschrieben): die Lernenden sehen nur ihren gewählten Zugang.
- Visualisierung der Kernaufgabe als durchgehende Leitidee, passend zum Thema. Jedes Eingabefeld ist sichtbar beschriftet, damit klar ist, wohin es gehört; optionale Hilfslinien/Marker erscheinen erst nach korrekter Eingabe.
- Interaktive Selbstkontrolle nach dem Muster «Rückmeldung» der Designbasis (Hinweis ohne Lösung).
- Bereich «Für die Lehrperson»: ausklappbar (verborgen bis Klick), mit vollständigen Lösungen und Wegen, getrennt vom Aufgabenteil; ein Satz zum didaktischen Anschluss ${anschluss}.
- PDF-Button oben («Als PDF herunterladen»): blendet für den Export alle Zugänge und den Lehrpersonen-Bereich ein und löst den Druckdialog aus; eigene @media-print-CSS blendet Reiter/Buttons aus; Fallback, der die Seite in einem neuen Tab öffnet, falls der Druckdialog blockiert ist.`}

§NOTIZ
Die Notiz nennt kurz: gewähltes Thema, Differenzierungsart und Zugänge, Sozialform, genutzter Twist, ${notizExtra}.${tailBlock}`;
}

/** User-Prompt für den Seitentyp «Prüfungsvorbereitung»: Lernziele checken, Übungsprüfung, Lücken schliessen. */
function pruefungPrompt(p: GenParams, material: { name?: string; text: string } | null): string {
  const fach = p.fach.trim() || "[Fach/Kontext]";
  const stufe = p.stufe.trim() || "[Zielstufe]";
  const thema = (p.thema ?? "").trim();
  const extra = (p.extra ?? "").trim();
  const dauer = p.dauer ?? 30;
  const punkte = dauer === 20 ? 20 : dauer === 45 ? 40 : 30;
  const hasMaterial = !!material && material.text.trim().length > 0;
  const themaLine = thema
    ? `- Prüfungsthema: ${thema}`
    : hasMaterial
      ? "- Prüfungsthema: leer – der Prüfungsstoff ist das gesamte Material"
      : "- Prüfungsthema: leer – leite einen typischen Prüfungsstoff aus Fach und Stufe ab";
  const extraLine = extra ? `\n- Zusatzwunsch: ${extra}` : "";
  const dateiLine = hasMaterial
    ? `- Material: ${material?.name ? `«${material.name}», ` : ""}Textauszug unten (= Prüfungsstoff)`
    : "- Material: keine Datei – arbeite allein mit den Angaben oben";
  const spr = spracheText(p);
  const materialBlock = hasMaterial ? `\n\n§MATERIAL (Textauszug)\n<<<\n${material!.text.trim()}\n>>>` : "";

  return `§ROLLE
Du bist Fachdidaktiker:in für ${fach} auf der Stufe ${stufe} und Frontend-Entwickler:in. Du bereitest Lernende auf eine Prüfung vor.

§ANGABEN
- Fach/Kontext: ${fach}
- Zielstufe: ${stufe}
${themaLine}${extraLine}
- Dauer der Übungsprüfung: ${dauer} Minuten, ${punkte} Punkte
${dateiLine}

§AUFGABE
Erstelle aus dem Prüfungsstoff eine interaktive Seite zur Prüfungsvorbereitung mit drei Teilen (als Reiter A, B, C): Lernziele checken, Übungsprüfung, Lücken schliessen. Erfinde keine Inhalte ausserhalb des Materials; fehlt auslesbarer Inhalt, wähle einen fachlich stimmigen, typischen Prüfungsstoff für Fach und Stufe und vermerke das in der Notiz.

§LERNZIELE
Leite aus dem Stoff 5 bis 6 operationalisierte Lernziele ab («Ich kann …»), nach Themen geordnet, jedes mit einer Gewichtung in Punkten (Summe = ${punkte}). Jede Aufgabe der Übungsprüfung ist genau einem Lernziel zugeordnet (data-ziel="z1" …).

§TEIL A – LERNZIELE CHECKEN (Reiter A)
- Liste aller Lernziele; zu jedem Lernziel eine Selbsteinschätzung per .choices («sicher», «unsicher», «noch nicht») und eine kurze Kontrollfrage mit Rückmeldung (richtig/falsch mit Hinweis, ohne Lösung).
- Knopf «Auswerten»: zeigt im .score-Block, wie viele Lernziele sicher sind, und listet die Lernziele auf, die in Teil C zu wiederholen sind (Verweis mit Reiterwechsel).

§TEIL B – ÜBUNGSPRÜFUNG (Reiter B)
- Kopf: Dauer ${dauer} Minuten, ${punkte} Punkte, Timer (.timer) mit Start/Stopp, nur Anzeige im Browser, keine Sperre.
- 6 bis 8 Aufgaben in Prüfungsform, gemischt: Berechnen/Anwenden, Zuordnen/Auswählen, Begründen (kurze Textantwort mit Musterlösung zum Selbstvergleich). Punkte je Aufgabe sichtbar (.pts). Eingaben werden erst beim Klick auf «Prüfung auswerten» geprüft. Formuliere knapp; die Seite muss kompakt bleiben.
- Auswertung im .score-Block: erreichte Punkte, Prozent, Note nach Schweizer Skala (Note = 1 + 5 × Punkte/Maximum, auf halbe Noten gerundet; mit dem Hinweis, dass die Lehrperson anders gewichten kann), je Aufgabe richtig/falsch mit Lösungsweg (erst nach Auswertung sichtbar), und eine Tabelle Lernziel → erreichte Punkte.
- Knopf «Nochmals versuchen» setzt alle Eingaben und den Timer zurück.

§TEIL C – LÜCKEN SCHLIESSEN (Reiter C)
- Pro Lernziel ein kompakter Abschnitt (.card): Merkblock (Regel, Formel oder drei Merksätze im .hint), ein durchgerechnetes Beispiel mit Lösungsweg, eine Übungsaufgabe mit sofortiger Rückmeldung.
- Am Ende ein Lernplan für die letzten drei Tage vor der Prüfung (Tabelle: Tag, Lernziele, Dauer, Methode), abgeleitet aus der Gewichtung.

§LEHRPERSON
Ausklappbarer Bereich (details.lehrperson): vollständige Lösungen und Punkteschlüssel der Übungsprüfung, typische Fehler je Lernziel, und die Übungsprüfung als reine Aufgabenliste zum Kopieren für eine Prüfung im Unterricht.
${spr ? "\n§" + spr + "\n" : ""}
§AUSGABEFORMAT – INTERAKTIVE WEBSITE
Eine einzige, voll funktionsfähige HTML-Seite (eine Datei, ohne externe Abhängigkeiten, offline lauffähig):
- Drei Reiter A/B/C nach der Designbasis; die Lernenden sehen nur den gewählten Teil.
- Interaktive Selbstkontrolle wie in der Designbasis (Klassen ok/err, .feedback); Timer und Auswertung in reinem JavaScript ohne Bibliotheken.
- PDF-Button oben («Als PDF herunterladen»): blendet für den Export alle Teile und den Lehrpersonen-Bereich ein und löst den Druckdialog aus; eigene @media-print-CSS blendet Reiter/Buttons/Timer aus; Fallback, der die Seite in einem neuen Tab öffnet, falls der Druckdialog blockiert ist.

§GESTALTUNG
Halte dich an die DESIGNBASIS aus dem System-Prompt (CSS unverändert, Grundgerüst für Prüfungsvorbereitung, Klassen). Eigenes CSS nur für fachspezifische Darstellungen (Formeln, Tabellen, kleine SVG). Responsiv bis Mobile, Tastaturbedienbarkeit, sichtbarer Fokus. Keine zusätzlichen Farben, Schatten, Verläufe oder Emojis.

§QUALITÄTSPRÜFUNG VOR DER AUSGABE
- Rechne alle Lösungen selbst nach; Punkteschlüssel und Notenformel müssen exakt stimmen (Summe der Punkte = ${punkte}).
- Jede Aufgabe ist genau einem Lernziel zugeordnet; die Lernziel-Tabelle in der Auswertung summiert korrekt.
- Kontrolliere alle Texte auf Tipp- und Flüchtigkeitsfehler; Schweizer Standarddeutsch.
- Die Notiz am Ende nennt Prüfungsstoff, Anzahl Lernziele und Aufgaben.${materialBlock}`;
}

/** User-Prompt für den Seitentyp «Lernspiel»: vier Levels, Punkte, Serie, Leben, Bestleistung. */
function spielPrompt(p: GenParams, material: { name?: string; text: string } | null): string {
  const fach = p.fach.trim() || "[Fach/Kontext]";
  const stufe = p.stufe.trim() || "[Zielstufe]";
  const thema = (p.thema ?? "").trim();
  const extra = (p.extra ?? "").trim();
  const hasMaterial = !!material && material.text.trim().length > 0;
  const themaLine = thema
    ? `- Thema: ${thema}`
    : hasMaterial
      ? "- Thema: leer – nimm die Begriffe, Regeln und Zusammenhänge aus dem Material"
      : "- Thema: leer – wähle ein spielbares Thema aus Fach und Stufe (Begriffe, Regeln, Zuordnungen)";
  const extraLine = extra ? `\n- Zusatzwunsch: ${extra}` : "";
  const dateiLine = hasMaterial
    ? `- Material: ${material?.name ? `«${material.name}», ` : ""}Textauszug unten (= Spielinhalt)`
    : "- Material: keine Datei – arbeite allein mit den Angaben oben";
  const spr = spracheText(p);
  const materialBlock = hasMaterial ? `\n\n§MATERIAL (Textauszug)\n<<<\n${material!.text.trim()}\n>>>` : "";

  return `§ROLLE
Du bist Fachdidaktiker:in für ${fach} auf der Stufe ${stufe} und Frontend-Entwickler:in. Du baust ein Lernspiel, das Wissen festigt, nicht nur abfragt.

§ANGABEN
- Fach/Kontext: ${fach}
- Zielstufe: ${stufe}
${themaLine}${extraLine}
${dateiLine}

§AUFGABE
Erstelle aus dem Inhalt ein interaktives Lernspiel mit vier Levels, Punkten, Serie, Leben und Bestleistung. Alle Aufgaben stammen aus dem Material; erfinde keine Inhalte ausserhalb. Fehlt auslesbarer Inhalt, wähle ein typisches, spielbares Thema für Fach und Stufe und vermerke das in der Notiz.

§SPIELINHALT
- 24 bis 28 Aufgaben als JavaScript-Datenfeld (Array von Objekten mit level, typ, frage, optionen/paare/reihenfolge, loesung, erklaerung), aus dem das Spiel und die Lehrpersonen-Liste gleichermassen gespeist werden.
- Level 1 «Erkennen»: Multiple Choice mit vier Optionen, eine richtig, plausible Ablenker.
- Level 2 «Erinnern»: Eingabe (Begriff, Zahl, Formelteil); Prüfung tolerant gegenüber Gross-/Kleinschreibung, Leerzeichen und sinnvollen Schreibvarianten (Liste erlaubter Antworten).
- Level 3 «Anwenden»: Zuordnen von Paaren per Klick (Begriff ↔ Erklärung, Fall ↔ Regel) oder Szenario mit Auswahl.
- Level 4 «Meistern»: Reihenfolge bilden (Schritte, Grössen, Zeitpunkte) oder Transferfrage mit Auswahl; nach der Antwort eine kurze Erklärung (.hint).
- 6 bis 7 Aufgaben je Level; die Reihenfolge innerhalb eines Levels wird bei jedem Start gemischt.

§SPIELMECHANIK
- Punkte: richtig beim ersten Versuch 10, beim zweiten 5; ab drei richtigen Antworten in Serie +5 Bonus. Serie bricht bei Fehler ab.
- Leben: drei pro Level (Anzeige als Zähler im .hud); bei null Leben wird das Level mit kurzer Meldung neu gestartet.
- Freischaltung: das nächste Level öffnet ab 70 Prozent richtig im aktuellen Level; gesperrte Reiter tragen Klasse locked.
- Fortschritt: .meter zeigt Aufgabe x von y im Level; .hud zeigt Punkte, Serie, Leben, Aufgabe.
- Nach jeder Antwort: Rückmeldung in .feedback, Knopf «Weiter»; bei Fehler kein Verraten der Lösung vor dem zweiten Versuch.
- Ende: .score mit Gesamtpunkten, richtig/falsch je Level, Bestleistung (localStorage, Schlüssel aus dem Titel) und Knopf «Nochmals spielen»; «Neu starten» oben setzt alles zurück.
- Reines JavaScript ohne Bibliotheken, keine Netzwerkzugriffe; Tastatur: Ziffern 1 bis 4 wählen Optionen, Enter bestätigt.

§LEHRPERSON
Ausklappbarer Bereich (details.lehrperson): alle Aufgaben mit Lösungen nach Level als Tabelle, drei Vorschläge für den Einsatz (Einzeltraining, Partnerduell, Wettkampf in Gruppen mit Zeitlimit), Hinweis zur Anpassung der Aufgaben im Datenfeld.
${spr ? "\n§" + spr + "\n" : ""}
§AUSGABEFORMAT – INTERAKTIVE WEBSITE
Eine einzige, voll funktionsfähige HTML-Seite (eine Datei, ohne externe Abhängigkeiten, offline lauffähig), Levels als Reiter nach der Designbasis, PDF-Button für die Aufgabenliste (blendet den Lehrpersonen-Bereich ein und druckt; Spielfläche und Knöpfe ausgeblendet).

§GESTALTUNG
Halte dich an die DESIGNBASIS aus dem System-Prompt (CSS unverändert, Grundgerüst für Lernspiel, Klassen). Eigenes CSS nur für Kleinigkeiten. Responsiv bis Mobile, Tastaturbedienbarkeit, sichtbarer Fokus. Keine zusätzlichen Farben, Schatten, Verläufe oder Emojis; Freude entsteht durch Rhythmus, Rückmeldung und Fortschritt, nicht durch Dekoration.

§QUALITÄTSPRÜFUNG VOR DER AUSGABE
- Jede Aufgabe hat genau eine eindeutige Lösung; bei Eingaben sind alle sinnvollen Schreibweisen erlaubt.
- Die Punkte- und Freischaltlogik funktioniert für alle vier Levels; «Nochmals spielen» setzt Punkte, Serie, Leben und Levels zurück.
- Kontrolliere alle Texte auf Tipp- und Flüchtigkeitsfehler; Schweizer Standarddeutsch; knapp formulieren.
- Die Notiz am Ende nennt Thema, Anzahl Aufgaben je Level.${materialBlock}`;
}

/** User-Prompt für den Seitentyp «Lernhilfe»: Merkblatt, Lernkarten, Glossar. */
function hilfePrompt(p: GenParams, material: { name?: string; text: string } | null): string {
  const fach = p.fach.trim() || "[Fach/Kontext]";
  const stufe = p.stufe.trim() || "[Zielstufe]";
  const thema = (p.thema ?? "").trim();
  const extra = (p.extra ?? "").trim();
  const hasMaterial = !!material && material.text.trim().length > 0;
  const themaLine = thema
    ? `- Thema: ${thema}`
    : hasMaterial
      ? "- Thema: leer – die Lernhilfe deckt das Material ab"
      : "- Thema: leer – wähle ein typisches Thema für Fach und Stufe";
  const extraLine = extra ? `\n- Zusatzwunsch: ${extra}` : "";
  const dateiLine = hasMaterial
    ? `- Material: ${material?.name ? `«${material.name}», ` : ""}Textauszug unten (= Stoff der Lernhilfe)`
    : "- Material: keine Datei – arbeite allein mit den Angaben oben";
  const spr = spracheText(p);
  const materialBlock = hasMaterial ? `\n\n§MATERIAL (Textauszug)\n<<<\n${material!.text.trim()}\n>>>` : "";

  return `§ROLLE
Du bist Fachdidaktiker:in für ${fach} auf der Stufe ${stufe} und Frontend-Entwickler:in. Du baust eine Lernhilfe, mit der Lernende den Stoff selbstständig verstehen, wiederholen und nachschlagen.

§ANGABEN
- Fach/Kontext: ${fach}
- Zielstufe: ${stufe}
${themaLine}${extraLine}
${dateiLine}

§AUFGABE
Erstelle aus dem Stoff eine interaktive Lernhilfe mit drei Teilen (Reiter A, B, C): Merkblatt, Lernkarten, Glossar. Alle Inhalte stammen aus dem Material; erfinde nichts darüber hinaus. Fehlt auslesbarer Inhalt, wähle ein typisches Thema für Fach und Stufe und vermerke das in der Notiz.

§TEIL A – MERKBLATT (Reiter A, druckbar auf eine A4-Seite)
- Kernaussagen: 5 bis 8 kurze Sätze, die den Stoff tragen.
- Regeln und Formeln: jede im .formel-Block mit einem Satz, wann sie gilt.
- «So gehe ich vor»: Schritt-für-Schritt-Rahmen (.steps) für das zentrale Verfahren oder die zentrale Denkbewegung, mit einem durchgerechneten oder durchgespielten Mini-Beispiel.
- Typische Fehler: drei Stolpersteine mit dem richtigen Weg (.hint).

§TEIL B – LERNKARTEN (Reiter B)
- 16 bis 24 Karten als JavaScript-Datenfeld (frage, antwort, thema). Vorderseite Frage oder Begriff, Rückseite Antwort in höchstens zwei Sätzen.
- Klick oder Enter dreht die Karte (.fc mit Klasse flipped). Unter jeder Karte zwei Knöpfe «Gewusst» und «Nochmals»; Zähler oben (gewusst / nochmals / offen).
- Knöpfe: «Mischen», «Nur Nochmals üben», «Alle zurücksetzen». Stand bleibt im Browser (localStorage, Schlüssel aus dem Titel).
- Druck: alle Karten als Raster mit Frage und Antwort sichtbar (Rückseite unter der Vorderseite), keine Umbrüche innerhalb einer Karte.

§TEIL C – GLOSSAR (Reiter C)
- 12 bis 20 Fachbegriffe alphabetisch als Definitionsliste (.gloss, dt/dd): Begriff, Erklärung in einfacher Sprache, ein Beispiel aus dem Material.
- Suchfeld (.search) filtert live beim Tippen; Treffer bleiben sichtbar, der Rest wird ausgeblendet.
- Bei zweisprachiger Vorgabe steht die Übersetzung direkt nach dem Begriff.

§LEHRPERSON
Ausklappbarer Bereich (details.lehrperson): Einsatzvorschläge (Vorbereitung, Wiederholung, Nachteilsausgleich), welche Teile des Materials abgedeckt sind, Hinweis zur Anpassung der Karten und des Glossars im Datenfeld.
${spr ? "\n§" + spr + "\n" : ""}
§AUSGABEFORMAT – INTERAKTIVE WEBSITE
Eine einzige, voll funktionsfähige HTML-Seite (eine Datei, ohne externe Abhängigkeiten, offline lauffähig), drei Reiter nach der Designbasis. PDF-Button oben («Als PDF drucken»): blendet alle Teile ein, druckt Merkblatt, Kartenraster und Glossar, Knöpfe und Suchfeld ausgeblendet; Fallback, der die Seite in einem neuen Tab öffnet, falls der Druckdialog blockiert ist.

§GESTALTUNG
Halte dich an die DESIGNBASIS aus dem System-Prompt (CSS unverändert, Grundgerüst für Lernhilfe, Klassen). Eigenes CSS nur für Kleinigkeiten. Responsiv bis Mobile, Tastaturbedienbarkeit, sichtbarer Fokus. Keine zusätzlichen Farben, Schatten, Verläufe oder Emojis.

§QUALITÄTSPRÜFUNG VOR DER AUSGABE
- Merkblatt fachlich korrekt und vollständig für den Stoff; Formeln und Regeln geprüft.
- Karten: jede Antwort eindeutig und kurz; Glossar alphabetisch; Suche funktioniert ohne Gross-/Kleinschreibung.
- Kontrolliere alle Texte auf Tipp- und Flüchtigkeitsfehler; Schweizer Standarddeutsch; knapp formulieren.
- Die Notiz am Ende nennt Thema, Anzahl Karten und Glossarbegriffe.${materialBlock}`;
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
