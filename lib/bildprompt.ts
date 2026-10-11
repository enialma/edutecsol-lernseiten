// Bildprompt für Lernaufgaben: dieselbe Logik wie public/bild-generator.html (dort in reinem JS),
// hier als TypeScript für den geschützten Bereich «Bild direkt erzeugen». Client-tauglich (kein Node-Import).

export type Einsatz = "beschreiben" | "interpretieren" | "vergleichen" | "ablauf" | "pruefen" | "konzept";

export type BildState = {
  e: Einsatz;
  thema: string; ziel: string; stil: string; motiv: string; handlung: string; umgebung: string; details: string;
  persp: string; platz: string; licht: string; muss: string; format: string; tool: string; braucht: string; pruefe: string;
  x: string[];
};

export const EINSATZ_LABELS: Record<Einsatz, string> = {
  beschreiben: "Beschreiben", interpretieren: "Interpretieren", vergleichen: "Vergleichen",
  ablauf: "Ablauf ordnen", pruefen: "Kritisch prüfen", konzept: "Konzeptbild",
};

export const TASKS: Record<Einsatz, string> = {
  beschreiben: "Beschreibe drei Tätigkeiten oder Gegenstände, die du im Bild erkennst. Formuliere anschliessend zwei Vermutungen. Kennzeichne, was du beobachtest und was du nur vermutest.",
  interpretieren: "Formuliere drei mögliche Erklärungen für die Situation. Nenne zu jeder Erklärung ein Bilddetail, auf das du dich beziehst.",
  vergleichen: "Vergleiche die beiden Darstellungen. Welche eignet sich für welchen Zweck? Begründe deine Einschätzung mit sichtbaren Details.",
  ablauf: "Beschreibe die Schritte mit «zuerst», «anschliessend» und «danach». Welche Zwischenschritte fehlen?",
  pruefen: "Du erhältst dieses Bild mit einer Nachricht. Bevor du es weiterleitest: Welche drei Dinge prüfst du? (Behauptung, Quelle, Kontext, unabhängige Belege)",
  konzept: "Welche Vorstellung vermittelt dieses Bild? Was zeigt es – und was lässt es weg?",
};

export const STILE = [
  "Sachliche Illustration", "Detailreiche Illustration", "Atmosphärische Illustration", "Flächige Illustration mit klaren Konturen",
  "Reduzierte Editorial-Illustration", "Sachliche technische Illustration", "Aquarell-Illustration", "Fotorealistische Darstellung",
];
export const PERSPEKTIVEN = [
  "", "Seitliche Nahaufnahme", "Seitliche Ansicht auf Arbeitshöhe", "Halbtotale auf Augenhöhe", "Weite Ansicht auf Augenhöhe", "Draufsicht",
  "Drei gleich grosse Bildfelder nebeneinander", "Zwei gleich grosse Bildfelder nebeneinander",
];
export const FORMATE = ["16:9 (Folie)", "4:3", "1:1", "3:4 (Arbeitsblatt hoch)"];
export const AUSSCHLUESSE = ["keine Schrift", "keine Logos", "keine realen Personen", "keine Sprechblasen", "keine stereotypen Darstellungen"];

export const BASE: BildState = {
  e: "beschreiben", thema: "", ziel: "", stil: "Sachliche Illustration", motiv: "", handlung: "", umgebung: "", details: "",
  persp: "", platz: "", licht: "", muss: "", format: "16:9 (Folie)", tool: "", braucht: "", pruefe: "",
  x: ["keine Schrift", "keine Logos", "keine realen Personen"],
};

type PresetDef = Partial<BildState> & { label: string };
export const PRESETS: Record<string, PresetDef> = {
  backstube: { label: "Backstube", e: "beschreiben", thema: "Arbeitsabläufe im Beruf", ziel: "Tätigkeiten beschreiben und Beobachtungen von Vermutungen unterscheiden", stil: "Sachliche Illustration", motiv: "Eine erwachsene, fiktive Person", handlung: "formt einen Brotlaib", umgebung: "an einem Arbeitstisch in einer fiktiven Backstube", details: "eine Teigkarte, eine Schüssel und etwas Mehl auf dem Tisch\nim Hintergrund ein Backofen und ein Regal mit wenigen Broten", persp: "Seitliche Nahaufnahme", licht: "helles, weiches Tageslicht; dezente Farben; ruhiger Hintergrund", muss: "Hände, Teig und Werkzeuge vollständig sichtbar", braucht: "eine fiktive Arbeitssituation mit gut sichtbaren Händen und Werkzeugen zeigt", pruefe: "ob Tätigkeit und Werkzeuge fachlich stimmen" },
  bahnhof: { label: "Bahnhof (Schreibanlass)", e: "interpretieren", thema: "Erzählen / Schreibanlass", ziel: "eine Geschichte beginnen und Beobachtung von Deutung trennen", stil: "Atmosphärische Illustration", motiv: "Eine erwachsene, fiktive Person", handlung: "steht auf einem fast leeren Bahnsteig und blickt auf einen unbeschrifteten Brief", umgebung: "in einem kleinen Bahnhof am frühen Morgen", details: "neben ihr ein geschlossener roter Koffer\nin der Ferne nähert sich ein Zug\nleichter Nebel", persp: "Weite Ansicht auf Augenhöhe", platz: "Person und Koffer im rechten Bilddrittel, links der leere Bahnsteig", licht: "kühles Morgenlicht, Blau- und Grautöne; der rote Koffer als einziger kräftiger Farbakzent", muss: "Brief, Koffer und Zug erkennbar", braucht: "offen bleibt und mehrere Deutungen zulässt", pruefe: "ob das Bild keine Deutung schon vorwegnimmt" },
  verkauf: { label: "Kundensituation", e: "interpretieren", thema: "Kundenkommunikation", ziel: "Beobachtungen und Interpretationen unterscheiden", stil: "Reduzierte Editorial-Illustration", motiv: "Eine erwachsene Kundin und ein erwachsener Verkäufer, beide fiktiv,", handlung: "stehen sich gegenüber; die Kundin mit verschränkten Armen, der Verkäufer mit leicht geöffneten Händen", umgebung: "an einem Verkaufstresen in einem Elektronikgeschäft", details: "zwischen beiden eine neutrale, ungeöffnete Produktverpackung\nzurückhaltende, nicht überzeichnete Gesichtsausdrücke\nim Hintergrund wenige Regale mit unbeschrifteten Produkten", persp: "Halbtotale auf Augenhöhe", licht: "helles, neutrales Licht; gedeckte Farben", muss: "Hände und Körperhaltungen gut sichtbar", x: ["keine Schrift", "keine Logos", "keine realen Personen", "keine Sprechblasen", "keine stereotypen Darstellungen"], braucht: "eine fiktive Verkaufsszene mit mehreren möglichen Deutungen zeigt", pruefe: "ob die Darstellung verständlich ist und keine Personen oder Gruppen stereotyp abwertet" },
  platz: { label: "Platz beschreiben", e: "beschreiben", thema: "Sprache: Ortsangaben", ziel: "eine Szene mit links, rechts, in der Mitte, vor und hinter beschreiben", stil: "Detailreiche Illustration", motiv: "Ein öffentlicher Platz", handlung: "mit drei klar getrennten Bereichen", umgebung: "in einer fiktiven Schweizer Kleinstadt", details: "links sitzt eine erwachsene Person auf einer Bank unter einem Baum\nin der Mitte gehen zwei erwachsene Personen über den Platz\nrechts fährt eine erwachsene Person auf einem Veloweg\nGebäude und ein Brunnen im Hintergrund", persp: "Weite Ansicht auf Augenhöhe", platz: "die drei Bereiche deutlich voneinander getrennt", licht: "helle Tageslichtstimmung, natürliche Farben", muss: "alle Tätigkeiten gut erkennbar", braucht: "klar getrennte Bereiche mit wenigen, gut erkennbaren Tätigkeiten zeigt", pruefe: "ob sich alle Ortsangaben eindeutig zuordnen lassen" },
  umschlag: { label: "Umschlag deuten", e: "interpretieren", thema: "Deutungen begründen", ziel: "unterschiedliche Deutungen derselben Situation entwickeln und mit Details belegen", stil: "Atmosphärische Illustration", motiv: "Zwei erwachsene, fiktive Personen", handlung: "an einer geöffneten Haustür; eine reicht der anderen einen geschlossenen Umschlag", umgebung: "in einem neutralen Eingangsbereich", details: "beide Gesichtsausdrücke zurückhaltend\nder Inhalt des Umschlags ist nicht sichtbar", persp: "Halbtotale auf Augenhöhe", licht: "weiches Abendlicht, gedeckte Farben", muss: "beide Personen, ihre Hände und der Umschlag gut erkennbar; keine eindeutige Erklärung der Situation", x: ["keine Schrift", "keine Logos", "keine realen Personen", "keine Sprechblasen"], braucht: "keine eindeutige Erklärung der Situation liefert", pruefe: "ob Mimik und Gesten wirklich mehrdeutig geblieben sind" },
  tische: { label: "Arbeitstische vergleichen", e: "vergleichen", thema: "Arbeitsorganisation", ziel: "zwei Arbeitsplatzanordnungen vergleichen und begründet beurteilen", stil: "Sachliche Illustration", motiv: "Zwei Arbeitstische ohne Personen", handlung: "mit denselben Gegenständen in unterschiedlicher Anordnung", umgebung: "auf weissem Hintergrund", details: "auf beiden Tischen: ein Laptop, ein Notizbuch, ein Stift, eine Wasserflasche, drei lose Blätter\nlinks ungeordnet verteilt\nrechts klar getrennt, vor dem Laptop eine freie Arbeitsfläche", persp: "Zwei gleich grosse Bildfelder nebeneinander", platz: "beide aus derselben Draufsicht", licht: "gleiche Farben und gleiche Gegenstandsgrössen", muss: "identische Gegenstände in beiden Feldern, keine zusätzlichen Gegenstände", x: ["keine Schrift", "keine Logos"], braucht: "dieselben Gegenstände in zwei Anordnungen zeigt", pruefe: "ob in beiden Feldern wirklich dieselben Gegenstände liegen" },
  ablauf: { label: "Bildfolge Ablauf", e: "ablauf", thema: "Arbeitsabläufe versprachlichen", ziel: "Schritte ordnen und mit Konnektoren beschreiben", stil: "Sachliche Illustration", motiv: "Zwei erwachsene Hände", handlung: "bei drei Arbeitsschritten der Brotherstellung", umgebung: "auf weissem Hintergrund", details: "links: Mehl wird in einer Schüssel abgewogen\nMitte: Teig wird auf einer Arbeitsfläche geknetet\nrechts: ein einzelner Brotlaib wird geformt", persp: "Drei gleich grosse Bildfelder nebeneinander", platz: "in allen Feldern dieselbe seitliche Perspektive, klare Abstände", licht: "derselbe einfache Stil und dieselbe dezente Farbpalette in allen Feldern", muss: "jeweils nur die Hände und die für den Schritt nötigen Gegenstände", x: ["keine Schrift", "keine Logos"], braucht: "drei klar unterscheidbare Schritte in derselben Perspektive zeigt", pruefe: "ob die Reihenfolge der Schritte fachlich stimmt" },
  pflege: { label: "Pflege: Blutdruck", e: "beschreiben", thema: "Pflegehandlung und Hygiene (HF Pflege)", ziel: "eine Pflegehandlung beschreiben, die vorbereitenden Hygienemassnahmen erkennen und Beobachtung von Interpretation unterscheiden", stil: "Sachliche Illustration", motiv: "Eine erwachsene, fiktive Pflegefachperson", handlung: "misst bei einer älteren, fiktiven Person im Pflegebett den Blutdruck", umgebung: "in einem ruhigen Pflegezimmer", details: "Blutdruckmanschette am Oberarm\nHändedesinfektionsspender am Bettende\nPflegewagen mit Handschuhbox\nNachttisch mit Wasserglas", persp: "Halbtotale auf Augenhöhe", licht: "helles Tageslicht, dezente Farben", muss: "beide Personen und die Hände gut erkennbar", braucht: "eine fiktive Pflegesituation mit sichtbaren Hygienemassnahmen zeigt", pruefe: "ob Manschettensitz, Handschuhe und Ablauf dem Standard entsprechen, mit einer Fachperson" },
  chatbild: { label: "Chat-Nachricht prüfen", e: "pruefen", thema: "Nachrichten mit Bild prüfen (Medienkompetenz)", ziel: "eine Chat-Nachricht mit Bild prüfen, bevor sie sie weiterleiten: Behauptung, Quelle, Kontext, Belege", stil: "Fotorealistische Darstellung", motiv: "Ein fiktives Schulzimmer nach einem Wasserschaden", handlung: "leer, ohne Personen", umgebung: "in einem nicht erkennbaren Schulgebäude", details: "Wasserpfützen auf dem Boden, die das Fensterlicht spiegeln\nPulte und Stühle mit durchsichtigen Plastikplanen abgedeckt\nzwei Putzeimer und ein Wischmopp in der Raummitte\ndunkler Wasserfleck an der Decke, ein abgehängtes Deckenpaneel\nleeres Whiteboard an der Stirnwand", persp: "Weite Ansicht auf Augenhöhe", platz: "von der Zimmertür aus, der ganze Raum sichtbar", licht: "graues Tageslicht durch die Fenster, gedämpfte Farben, kühle Stimmung", muss: "kein erkennbares Gebäude, keine Ortshinweise", x: ["keine Schrift", "keine Logos", "keine realen Personen"], braucht: "wie ein echtes Chat-Foto wirkt und keine Ortshinweise enthält", pruefe: "ob das Material als Übungsszenario gekennzeichnet ist und im Unterricht aufgelöst wird" },
  markt: { label: "Französisch: Marché", e: "beschreiben", thema: "Französisch: Au marché (A2/B1)", ziel: "Lebensmittel benennen, Mengen und Preise erfragen und einen kurzen Verkaufsdialog führen", stil: "Detailreiche Illustration", motiv: "Eine erwachsene, fiktive Marktverkäuferin mit Schürze und ein erwachsener, fiktiver Kunde mit Stoffeinkaufstasche", handlung: "sie reicht ihm eine Papiertüte über den Stand", umgebung: "an einem Marktstand auf einem Wochenmarkt in einer französischen Kleinstadt", details: "Körbe mit Äpfeln, Tomaten, Zwiebeln und Zitronen\nein Laib Käse und zwei Baguettes\neine mechanische Waage\nkleine leere Preisschilder ohne Schrift\neine gestreifte Markise", persp: "Halbtotale auf Augenhöhe", licht: "helles Vormittagslicht, warme, natürliche Farben", muss: "beide Personen, ihre Hände und die Lebensmittel gut erkennbar", x: ["keine Schrift", "keine Logos", "keine realen Personen", "keine Sprechblasen"], braucht: "mindestens zehn klar benennbare Lebensmittel und Gegenstände zeigt", pruefe: "ob die Preisschilder wirklich leer sind und keine Klischees drin stecken" },
  bushalte: { label: "Deutsch: Schreibanlass", e: "interpretieren", thema: "Deutsch: Schreibanlass und Erzählperspektive", ziel: "Beobachtung und Deutung trennen, eine Erzählperspektive wählen und einen inneren Monolog schreiben", stil: "Atmosphärische Illustration", motiv: "Zwei erwachsene, fiktive Personen", handlung: "stehen mit Abstand unter einem Wartehäuschen und blicken in verschiedene Richtungen, zwischen ihnen eine leere Sitzbank", umgebung: "an einer Bushaltestelle am späten Nachmittag im Regen", details: "eine Person hält einen geschlossenen Regenschirm, die andere einen Blumenstrauss in Papier\nein kleiner Hund sitzt neben der Bank und schaut zu einer Person hoch\nnasse Strasse, die das Licht einer Strassenlaterne spiegelt\nin der Ferne nähert sich ein Bus mit Scheinwerfern", persp: "Weite Ansicht auf Augenhöhe", platz: "Haltestelle im rechten Bilddrittel, links die leere Strasse", licht: "Dämmerlicht, Blau- und Grautöne; der Blumenstrauss als einziger kräftiger Farbakzent", muss: "beide Gesichtsausdrücke zurückhaltend, keine eindeutige Erklärung der Situation", x: ["keine Schrift", "keine Logos", "keine realen Personen", "keine Sprechblasen"], braucht: "offen bleibt und mehrere Deutungen zulässt", pruefe: "ob das Bild die Geschichte nicht schon erzählt" },
  wohnung: { label: "ABU: Wohnungsübergabe", e: "pruefen", thema: "ABU: Wohnen und Mietrecht", ziel: "Mängel erkennen, normale Abnutzung von Schaden unterscheiden und die Zuordnung mit dem Mietrecht begründen", stil: "Detailreiche Illustration", motiv: "Eine erwachsene, fiktive Person mit Klemmbrett und eine erwachsene, fiktive Person mit Schlüsselbund", handlung: "stehen bei der Wohnungsübergabe im Wohnzimmer", umgebung: "in einer fiktiven, leer geräumten Mietwohnung", details: "deutliche Kratzer und ein dunkler Fleck im Parkettboden\nmehrere Bohrlöcher und ein helles Rechteck an der Wand, wo ein Bild hing\nein vergilbter Lichtschalter\nein abgenutzter Teppichrand im Türbereich\nein Fenster mit leicht vergilbtem Rahmen", persp: "Halbtotale auf Augenhöhe", platz: "Boden und Wand mit den Mängeln gross, die Personen seitlich", licht: "neutrales Tageslicht, gedeckte Farben, ruhiger Raum", muss: "Klemmbrett ohne Schrift, Mängel gut erkennbar", x: ["keine Schrift", "keine Logos", "keine realen Personen", "keine Sprechblasen", "keine stereotypen Darstellungen"], braucht: "mindestens fünf unterscheidbare Mängel zeigt, deren Zuordnung diskutierbar bleibt", pruefe: "ob die Mängel fachlich plausibel und nicht zu eindeutig sind" },
};

export function presetState(key: string): BildState {
  const p = PRESETS[key];
  if (!p) return { ...BASE };
  const { label: _label, ...rest } = p;
  void _label;
  return { ...BASE, ...rest, x: rest.x ?? BASE.x };
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const low = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const line = (s: string) => s.split("\n").map((t) => t.trim().replace(/[;,.]+$/, "")).filter(Boolean).join("; ");
const t = (s: string | undefined) => (s ?? "").trim();

/** Normalisiert beliebige Eingaben (z. B. aus einem Teilen-Link) auf einen gültigen Zustand. */
export function normalize(o: unknown): BildState {
  const src = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const s: BildState = { ...BASE };
  (Object.keys(BASE) as (keyof BildState)[]).forEach((k) => {
    if (k === "x") return;
    if (k === "e") { s.e = (Object.keys(TASKS) as Einsatz[]).includes(src.e as Einsatz) ? (src.e as Einsatz) : "beschreiben"; return; }
    const v = src[k];
    s[k] = typeof v === "string" ? v.slice(0, 1500) : "";
  });
  s.x = Array.isArray(src.x) ? src.x.filter((v): v is string => typeof v === "string" && AUSSCHLUESSE.includes(v)) : [...BASE.x];
  if (!STILE.includes(s.stil)) s.stil = BASE.stil;
  if (!PERSPEKTIVEN.includes(s.persp)) s.persp = "";
  if (!FORMATE.includes(s.format)) s.format = BASE.format;
  return s;
}

/** Der Bildprompt, wortgleich mit dem kostenlosen Bildprompt-Generator. */
export function buildPrompt(s: BildState): string {
  const motiv = t(s.motiv), hand = line(t(s.handlung)), umg = t(s.umgebung);
  const det = t(s.details).split("\n").map((d) => d.trim()).filter(Boolean);
  const p: string[] = [];
  let first = t(s.stil) || BASE.stil;
  const scene = [motiv ? low(motiv) : "", hand, umg].filter(Boolean).join(" ");
  if (scene) first += ": " + scene;
  p.push(first.replace(/[.\s]+$/, "") + ".");
  if (det.length) p.push("Wichtige sichtbare Details:\n" + det.map((d) => "– " + cap(d)).join("\n"));
  const ba = [t(s.persp), line(t(s.platz))].filter(Boolean).join(". ");
  if (ba) p.push("Bildaufbau: " + cap(ba) + ".");
  if (t(s.licht)) p.push("Licht und Farben: " + cap(t(s.licht)) + ".");
  const req: string[] = [];
  if (t(s.muss)) req.push(cap(t(s.muss)) + ".");
  if (s.x.length) req.push(cap(s.x.join(", ")) + ".");
  if (req.length) p.push("Weitere Anforderungen: " + req.join(" "));
  return p.join("\n\n");
}

/** Zusatz nur für die direkte Erzeugung: das Bildmodell soll keine Beschriftung und keine realen Marken liefern. */
export function promptForModel(s: BildState): string {
  const base = buildPrompt(s);
  const extra = [
    "Das Bild ist Unterrichtsmaterial für eine Lernaufgabe: klar, ruhig, ohne Textüberlagerungen, ohne Wasserzeichen, ohne Rahmen.",
    s.x.includes("keine realen Personen") ? "Alle Personen sind fiktiv und erwachsen, keine erkennbaren realen Personen." : "",
  ].filter(Boolean).join(" ");
  return base + "\n\n" + extra;
}

export function labelText(tool: string, date = new Date()): string {
  return `KI-generierte Illustration, erstellt mit ${tool || "[Tool]"}, ${date.toLocaleDateString("de-CH")}; fiktive Szene.`;
}

export function recipeLines(s: BildState): [string, string][] {
  return [
    ["Mein Unterrichtsthema ist", t(s.thema)],
    ["Die Lernenden sollen mit dem Bild", t(s.ziel)],
    ["Dafür brauche ich eine Darstellung, die", t(s.braucht)],
    ["Vor dem Einsatz prüfe ich,", t(s.pruefe)],
  ];
}

/** Änderungsaufträge fürs Nachbessern, abhängig von Perspektive, Muss-Angabe, Einsatz und Platzierung. */
export function fixes(s: BildState): string[] {
  const persp = t(s.persp), muss = t(s.muss).replace(/[.]+$/, ""), platz = line(t(s.platz));
  const out = ["Vereinfache nur den Hintergrund. Behalte Hauptmotiv, Perspektive und Farbpalette bei."];
  let nearDone = false;
  if (/Bildfelder/.test(persp)) {
    out.push("Zeige alle Bildfelder gleich gross, mit derselben Perspektive und derselben Farbpalette. Keine Rahmen, keine Schrift zwischen den Feldern.");
  } else if (/Nahaufnahme|Draufsicht|Arbeitshöhe/.test(persp)) {
    out.push("Zeige die Szene aus grösserer Entfernung, sodass die vollständigen Körperhaltungen sichtbar sind. Behalte den Stil bei.");
  } else if (/Weite Ansicht|Halbtotale/.test(persp)) {
    out.push(muss ? `Gehe näher an das Hauptmotiv heran. Folgendes muss gross und deutlich sichtbar sein: ${muss}. Behalte den Stil bei.` : "Gehe näher an das Hauptmotiv heran, sodass die entscheidenden Details gross und deutlich sichtbar sind. Behalte den Stil bei.");
    nearDone = !!muss;
  } else {
    out.push("Zeige die Szene aus grösserer Entfernung, sodass die vollständigen Körperhaltungen sichtbar sind. Behalte den Stil bei.");
  }
  if (muss && !nearDone) out.push(`Achte darauf, dass Folgendes vollständig und gut erkennbar ist: ${muss}. Lasse alles andere unverändert.`);
  const E: Record<Einsatz, string> = {
    beschreiben: "Rücke die Tätigkeit in den Vordergrund: Hände und Werkzeug deutlich, Hintergrund ruhiger.",
    interpretieren: "Mache Mimik und Gestik zurückhaltender, sodass die Situation mehrdeutig bleibt. Keine eindeutige Erklärung im Bild.",
    vergleichen: "Verwende in beiden Darstellungen exakt dieselben Gegenstände in derselben Grösse, nur anders angeordnet.",
    ablauf: "Zeige in jedem Feld nur einen Arbeitsschritt, in der beschriebenen Reihenfolge von links nach rechts.",
    pruefen: "Entferne alle Hinweise auf einen realen Ort: Schilder, bekannte Gebäude, Nummernschilder, erkennbare Logos.",
    konzept: "Reduziere auf die wesentlichen Elemente. Entferne alles, was nicht zum Konzept gehört.",
  };
  out.push(E[s.e]);
  if (s.x.includes("keine Schrift")) out.push("Entferne alle Schrift, Zahlen und Symbole im Bild. Behalte die übrige Szene möglichst unverändert bei.");
  if (platz) out.push(`Ändere nur die Anordnung: ${platz}. Lasse Stil, Motiv und Farben unverändert.`);
  else out.push("Verschiebe das Hauptmotiv in die rechte Bildhälfte. Lasse links eine ruhige, helle Fläche für einen Titel frei.");
  return out.slice(0, 6);
}

export function titleFor(s: BildState): string {
  const base = t(s.thema) || t(s.motiv) || "Bild für Lernaufgabe";
  return base.length > 70 ? base.slice(0, 67) + "…" : base;
}

/** Zustand als base64url-JSON, kompatibel mit dem Teilen-Link des kostenlosen Generators (#r=…). */
export function encodeState(s: BildState): string {
  const json = JSON.stringify(s);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(h: string): BildState | null {
  try {
    const b = h.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return normalize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}
