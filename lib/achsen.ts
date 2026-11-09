// Achsen für «Direkt erzeugen» (Seitentyp Lernseite): Zugänge je Differenzierungsart, Sozialformen und die Texte der Info-Kreise.
// Gemeinsam genutzt vom Formular (Client) und von lib/prompt.ts (Server), daher ohne Server-Abhängigkeiten.
// Inhalte wie im Prompt-Generator (public/prompt-generator-v2.html).

export type DiffartWahl = "niveau" | "lerntyp" | "interesse";
export type Sozialform = "einzel" | "partner" | "gruppe" | "plenum";
export type ZugangOpt = { v: string; name: string; info: string };

export const DIFFART_WAHL: DiffartWahl[] = ["niveau", "lerntyp", "interesse"];

export const ZUGAENGE: Record<DiffartWahl, ZugangOpt[]> = {
  niveau: [
    { v: "unterstuetzt", name: "Mit Unterstützung", info: "Viel Hilfe: Fachbegriffe erklärt, Lösungsrahmen zum Ausfüllen, Leitfragen und Satzanfang." },
    { v: "eigenstaendig", name: "Eigenständig", info: "Gleiche Aufgabe ohne Hilfen, mit Ergebnisprüfung und Selbstcheck." },
    { v: "vertiefung", name: "Vertiefung", info: "Kernaufgabe mit Twist, Begründungs- und Transferfrage." },
    { v: "expert", name: "Expert", info: "Offene Problemstellung ohne vorgegebenen Lösungsweg; Vorgehen selbst wählen und begründen." },
  ],
  lerntyp: [
    { v: "visuell", name: "visuell/grafisch", info: "Über Grafik, Diagramm oder Skizze: ablesen, einzeichnen, zuordnen." },
    { v: "rechnerisch", name: "rechnerisch/formal", info: "Über Formel, Tabelle und schrittweisen Lösungsweg." },
    { v: "sprachlich", name: "sprachlich/erklärend", info: "Über Text: Vorgehen und Ergebnis in eigenen Worten erklären und begründen." },
    { v: "handlung", name: "handlungsorientiert", info: "Über eine konkrete Handlung oder Simulation, Schritt für Schritt wie im Berufsalltag." },
  ],
  interesse: [
    { v: "gesundheit", name: "Gesundheit & Soziales", info: "Beispiele aus Pflege, Arztpraxis, Apotheke oder Betreuung." },
    { v: "technik", name: "Technik & Handwerk", info: "Beispiele aus Werkstatt, Bau, Elektro oder Informatik." },
    { v: "wirtschaft", name: "Wirtschaft & Verwaltung", info: "Beispiele aus Büro, Buchhaltung oder Logistik." },
    { v: "handel", name: "Handel & Dienstleistung", info: "Beispiele aus Detailhandel, Gastronomie oder Kundenkontakt." },
  ],
};

/** Eigene Berufsfelder (nur bei «nach Berufsfeld»): Schlüssel = Präfix + Name. */
export const EIGEN_PREFIX = "eigen:";
export const MAX_EIGENE = 4;
export const MAX_EIGEN_LEN = 60;
export const eigenesFeld = (name: string): ZugangOpt => ({ v: EIGEN_PREFIX + name, name, info: "Eigenes Berufsfeld." });

/** Alle Zugänge einer Differenzierungsart in Skalen-Reihenfolge, bei Berufsfeld inkl. eigener Felder. */
export function zugangOptionen(diffart: DiffartWahl, eigene: string[] = []): ZugangOpt[] {
  return diffart === "interesse" ? [...ZUGAENGE.interesse, ...eigene.map(eigenesFeld)] : ZUGAENGE[diffart];
}

/** Voreinstellung im Formular: bei Niveau nur «Eigenständig», sonst die ersten drei Zugänge. */
export const defaultZugaenge = (diffart: DiffartWahl): string[] =>
  diffart === "niveau" ? ["eigenstaendig"] : ZUGAENGE[diffart].slice(0, 3).map((o) => o.v);

/** Alte gespeicherte Seiten ohne gewählte Zugänge hatten immer die ersten drei. */
export const alteZugaenge = (diffart: DiffartWahl): string[] => ZUGAENGE[diffart].slice(0, 3).map((o) => o.v);

export const SOZIALFORMEN: { v: Sozialform; name: string; info: string }[] = [
  { v: "einzel", name: "Einzelarbeit", info: "Alle arbeiten allein. Standard." },
  { v: "partner", name: "Partnerarbeit", info: "Zu zweit mit festen Rollen, die wechseln, und einem gemeinsamen Ergebnis." },
  { v: "gruppe", name: "Gruppenarbeit", info: "Drei bis vier Personen mit verteilten Teilaufgaben und einem gemeinsamen Ergebnis." },
  { v: "plenum", name: "Plenum", info: "Die ganze Klasse gemeinsam, von der Lehrperson geführt, mit Diskussionsfragen." },
];

/** Texte der Info-Kreise: je Achse eine Erklärung pro Option und optional ein Hinweis darunter. */
export type InfoText = { opts: Record<string, string>; note?: string };

export const INFO: Record<"typ" | "diffart" | "zugaenge" | "sozialform" | "sprache" | "twist" | "niveau", InfoText> = {
  typ: {
    opts: {
      lernseite: "Interaktive Website zum Üben am Gerät: eine Kernaufgabe mit mehreren Zugängen, Selbstkontrolle und Lehrpersonen-Bereich.",
      arbeitsblatt: "Arbeitsblatt zum Austeilen: Zugänge untereinander, Platz zum Bearbeiten und Lösungsblatt. Zum Drucken oder als Word.",
      pruefung: "Lernziele checken, Übungsprüfung mit Timer und Note, Lücken schliessen mit Lernplan.",
      spiel: "Vier Levels mit Punkten, Serie und Leben, aus den Begriffen und Regeln des Materials.",
      hilfe: "Merkblatt auf einer A4-Seite, Lernkarten zum Umdrehen und Glossar mit Suche.",
    },
    note: "Differenzierung, Sozialform und Feinsteuerung gibt es bei Lernseite und Arbeitsblatt.",
  },
  diffart: {
    opts: {
      niveau: "Alle bearbeiten dieselbe Aufgabe, die Zugänge unterscheiden sich nur in der Hilfe: Mit Unterstützung, Eigenständig, Vertiefung, Expert.",
      lerntyp: "Dieselbe Aufgabe auf gleichem Niveau, aber über verschiedene Kanäle: grafisch, rechnerisch, sprachlich oder handlungsorientiert.",
      interesse: "Dieselbe Kompetenz in verschiedenen Berufsfeldern: Gesundheit & Soziales, Technik & Handwerk, Wirtschaft & Verwaltung, Handel & Dienstleistung.",
    },
    note: "Darunter wählst du, welche Zugänge entstehen. Bei Berufsfeld fügst du mit «+» eigene Felder hinzu.",
  },
  zugaenge: {
    // Erklärungen kommen aus ZUGAENGE bzw. eigenesFeld()
    opts: {},
    note: "Nicht gewählte Zugänge stehen trotzdem als Vergleich im Prompt, damit die KI die gewählten richtig abgrenzt. Mehr Zugänge machen die Erzeugung länger.",
  },
  sozialform: {
    opts: Object.fromEntries(SOZIALFORMEN.map((o) => [o.v, o.info])),
    note: "Bei mehreren Sozialformen entsteht jeder Arbeitsauftrag in jeder gewählten Version, mit Umschalter auf der Seite; Kernaufgabe und Lösungen bleiben gleich.",
  },
  sprache: {
    opts: {
      standard: "Keine sprachliche Anpassung.",
      einfach: "Kurze Sätze, ein Gedanke pro Satz, Fachbegriffe werden bei der ersten Verwendung einfach erklärt.",
      glossar: "Die Fachsprache bleibt, dazu kommt ein aufklappbares Glossar mit einfachen Erklärungen.",
      zweisprachig: "Zentrale Begriffe stehen zusätzlich in einer zweiten Sprache, die du darunter einträgst. Der übrige Text bleibt Deutsch.",
    },
  },
  twist: {
    opts: {
      auto: "Die KI wählt einen Twist, der zum Thema passt.",
      ausreisser: "Ein Extremwert kommt dazu. Die Lernenden prüfen, welche Grössen stabil bleiben und welche sich stark ändern.",
      vergleich: "Mehrere Fälle mit unterschiedlichen Zahlen führen zum gleichen Ergebnis. Die Lernenden erkennen die Regel dahinter.",
      grenzfall: "Ein Sonderfall, bei dem die einfache Regel nicht reicht und eine genauere Begründung nötig ist.",
      fehler: "Absichtlich falsche Ergebnisse oder Aussagen, die die Lernenden finden und begründen.",
      methoden: "Eine zweite Methode wird der gelernten gegenübergestellt. Die Lernenden begründen Vor- und Nachteile.",
      transfer: "Das Verfahren wird auf eine neue, berufsnahe Situation übertragen.",
    },
    note: "Bei Niveau gilt der Twist für Vertiefung und Expert, sonst als Zusatzaufgabe am Schluss jedes Zugangs. Er verlangt mehr Denkarbeit statt mehr Aufgaben.",
  },
  niveau: {
    opts: {
      reproduzieren: "Verfahren korrekt ausführen und auf gleichartige Aufgaben übertragen.",
      anwenden: "Verfahren selbstständig in einer sinnvollen Situation anwenden und begründen.",
      beurteilen: "Ergebnisse und Methoden bewerten, vergleichen und die Wahl begründen.",
    },
  },
};
