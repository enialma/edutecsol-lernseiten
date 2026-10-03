// Die öffentlichen Beispielseiten (public/*.html) als Pool-Seiten in die Datenbank übernehmen.
import { createPage, importedBeispiele, setPool } from "./pages";

type Beispiel = { file: string; title: string; fach: string; stufe: string; thema: string };

const BM = "Berufsmaturität", BB = "Berufsbildung", PHARMA = "Pharma-Assistentinnen";

export const BEISPIELE: Beispiel[] = [
  { file: "statistik-lagemasse.html", title: "Lagemasse – Mittelwert, Median, Modus", fach: "Mathematik", stufe: BM, thema: "Statistik: Lagemasse und Ausreisser" },
  { file: "statistik-quartile-boxplot.html", title: "Quartile und Boxplot", fach: "Mathematik", stufe: BM, thema: "Statistik: Fünf-Punkte-Zusammenfassung, IQR" },
  { file: "statistik-variablentypen.html", title: "Variablentypen zuordnen", fach: "Mathematik", stufe: BM, thema: "Statistik: nominal, ordinal, diskret, stetig" },
  { file: "degressive-abschreibung.html", title: "Degressive Abschreibung", fach: "Mathematik", stufe: BM, thema: "Buchwertverlauf, Vergleich mit linearer Abschreibung" },
  { file: "prozentrechnen.html", title: "Prozentrechnen – Umfrage-Aufgabe", fach: "Mathematik", stufe: BM, thema: "Grundwert, Prozentwert, Prozentsatz" },
  { file: "dosisberechnung-pharma.html", title: "Dosisberechnung", fach: "Medizinisches Rechnen", stufe: PHARMA, thema: "Von mg/kg zur ml-Menge, Dosierungsfehler erkennen" },
  { file: "dichte-pharma.html", title: "Rechnen mit der Dichte", fach: "Medizinisches Rechnen", stufe: PHARMA, thema: "Masse, Volumen, Dichte" },
  { file: "verduennungen-pharma.html", title: "Verdünnungen", fach: "Medizinisches Rechnen", stufe: PHARMA, thema: "C₁·V₁ = C₂·V₂, typische Denkfehler" },
  { file: "it-security-malware.html", title: "IT-Security – Malware & persönliche Sicherheit", fach: "IT-Security", stufe: BB, thema: "Malware-Arten, Szenarien, Phishing erkennen" },
  { file: "ki-geschichte.html", title: "Geschichte der KI – Meilensteine richtig einordnen", fach: "Künstliche Intelligenz", stufe: "Sekundarstufe II", thema: "Meilensteine und Funktionsprinzipien von KI-Systemen" },
  { file: "franzoesisch-hoeflich-klaeren.html", title: "Französisch im Betrieb – Hilfe erbitten und Missverständnisse klären", fach: "Französisch", stufe: BB, thema: "Redemittel: klären, nachfragen, sich entschuldigen" },
  { file: "franzoesisch-bm-variante.html", title: "Voci-Training Französisch – Im Betrieb höflich klären", fach: "Französisch", stufe: BM, thema: "Redemittel im Betrieb, BM-Variante" },
  { file: "franzoesisch-voci-game.html", title: "Voci-Mission Französisch (Spiel)", fach: "Französisch", stufe: BB, thema: "Vokabeltraining in vier Levels" },
  { file: "pflegedokumentation.html", title: "Pflegedokumentation: Beobachtung, Aussage oder Interpretation?", fach: "Pflege", stufe: BB, thema: "Fachsprache: präzise dokumentieren" },
];

export async function missingBeispiele(): Promise<Beispiel[]> {
  const have = new Set(await importedBeispiele());
  return BEISPIELE.filter((b) => !have.has(b.file));
}

/** Holt fehlende Beispielseiten von der eigenen Site und legt sie als Pool-Seiten der Admin-Person an. */
export async function importBeispiele(userId: number, origin: string): Promise<number> {
  let n = 0;
  for (const b of await missingBeispiele()) {
    const res = await fetch(`${origin}/${b.file}`);
    if (!res.ok) continue;
    // Der «← Übersicht»-Link zeigt auf die öffentliche Startseite und führt aus der Sammlung ins Leere
    const html = (await res.text()).replace(/<a\s[^>]*href="index\.html"[^>]*>[\s\S]*?<\/a>/i, "");
    const id = await createPage({
      userId, title: b.title, fach: b.fach, stufe: b.stufe, thema: b.thema, params: {}, materialName: b.file,
      provider: "beispiel", inputTokens: 0, outputTokens: 0, durationMs: 0, html,
    });
    await setPool(id, userId, true, true);
    n++;
  }
  return n;
}
