"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderOpt = { id: string; label: string; model: string; used: number; limit: number | null };
type Preset = { id: string; label: string; fach?: string; stufe?: string; diffart?: string; anzahl?: number; sprache?: string; twist?: string; niveau?: string };
type Bild = { id: number; title: string };

const TYP = [["lernseite", "Lernseite"], ["pruefung", "Prüfungsvorbereitung"], ["spiel", "Lernspiel"]];
const DAUER = [["20", "20 Minuten"], ["30", "30 Minuten"], ["45", "45 Minuten"]];
const DIFFART = [["niveau", "nach Niveau (Hilfe)"], ["lerntyp", "nach Lerntyp"], ["interesse", "nach Berufsfeld"], ["sozialform", "nach Sozialform"]];
const SPRACHE = [["standard", "Standard"], ["einfach", "vereinfachte Sprache"], ["glossar", "Fachbegriffe mit Glossar"], ["zweisprachig", "Schlüsselbegriffe zweisprachig"]];
const TWIST = [["auto", "passend wählen"], ["ausreisser", "Ausreisser/Robustheit"], ["vergleich", "Fälle vergleichen"], ["grenzfall", "Grenzfall"], ["fehler", "Fehler erkennen"], ["methoden", "Methoden vergleichen"], ["transfer", "Transfer/Anwendung"]];
const NIVEAU = [["reproduzieren", "reproduzieren"], ["anwenden", "anwenden"], ["beurteilen", "beurteilen"]];

type State = {
  typ: string; dauer: string;
  fach: string; stufe: string; thema: string; extra: string; material: string;
  diffart: string; anzahl: number; sprache: string; zweitsprache: string; twist: string; niveau: string; provider: string; bild: number; modell: string;
};

export default function Form({ providers, presets, bilder, initialBild, isAdmin }: { providers: ProviderOpt[]; presets: Preset[]; bilder: Bild[]; initialBild: number; isAdmin: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [s, setS] = useState<State>({
    typ: "lernseite", dauer: "30",
    fach: "", stufe: "", thema: "", extra: "", material: "",
    diffart: "niveau", anzahl: 3, sprache: "standard", zweitsprache: "", twist: "auto", niveau: "anwenden",
    provider: (providers.find((p) => p.limit === null || p.used < p.limit) ?? providers[0]).id,
    bild: bilder.some((b) => b.id === initialBild) ? initialBild : 0,
    modell: "",
  });
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof State, v: string | number) => setS((p) => ({ ...p, [k]: v }));
  const pruefung = s.typ === "pruefung";
  const spiel = s.typ === "spiel";
  const lernseite = !pruefung && !spiel;

  function applyPreset(p: Preset) {
    setS((prev) => ({
      ...prev, thema: "", extra: "",
      fach: p.fach ?? prev.fach, stufe: p.stufe ?? prev.stufe, diffart: p.diffart ?? prev.diffart,
      anzahl: p.anzahl ?? prev.anzahl, sprache: p.sprache ?? prev.sprache, twist: p.twist ?? prev.twist, niveau: p.niveau ?? prev.niveau,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLog([]);
    setBusy(true);
    const fd = new FormData();
    Object.entries(s).forEach(([k, v]) => fd.set(k, String(v)));
    const f = fileRef.current?.files?.[0];
    if (f) fd.set("datei", f);
    try {
      const res = await fetch("/api/erzeugen", { method: "POST", body: fd });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let doneId: number | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("@@DONE ")) doneId = JSON.parse(line.slice(7)).id;
          else if (line.startsWith("@@ERROR ")) throw new Error(line.slice(8));
          else if (line.trim()) setLog((l) => [...l, line]);
        }
      }
      if (doneId) router.push(`/app/seiten/${doneId}`);
      else throw new Error("Die Verbindung wurde unterbrochen, bevor die Seite fertig war.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const current = providers.find((p) => p.id === s.provider) ?? providers[0];
  const exhausted = current.limit !== null && current.used >= current.limit;

  const Seg = ({ k, opts }: { k: keyof State; opts: string[][] }) => (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button type="button" key={v} className={s[k] === v ? "on" : ""} onClick={() => set(k, v)} disabled={busy}>{l}</button>
      ))}
    </div>
  );

  return (
    <form onSubmit={submit} className="card">
      <label style={{ marginTop: 0 }}>Was soll entstehen?</label>
      <Seg k="typ" opts={TYP} />
      <p className="small-note" style={{ margin: ".4rem 0 .2rem" }}>
        {pruefung
          ? "Aus dem Prüfungsstoff entstehen drei Teile: Lernziele checken, Übungsprüfung mit Timer und Note, Lücken schliessen mit Lernplan. Dazu ein Lehrpersonen-Bereich mit Lösungen und Punkteschlüssel."
          : spiel
            ? "Vier Levels (Erkennen, Erinnern, Anwenden, Meistern) mit 24 bis 28 Aufgaben aus dem Material, Punkten, Serie, Leben und Bestleistung. Dazu die Aufgabenliste für die Lehrperson."
            : "Eine Kernaufgabe mit mehreren Zugängen, Selbstkontrolle und Lehrpersonen-Bereich."}
      </p>

      <div className="row" style={{ margin: ".8rem 0 .6rem", alignItems: "center" }}>
        <span className="small-note">Schnellstart:</span>
        {presets.map((p) => <button type="button" key={p.id} className="btn small ghost" onClick={() => applyPreset(p)} disabled={busy}>{p.label}</button>)}
      </div>

      <div className="form-grid">
        <div><label>Fach / Kontext *</label><input value={s.fach} onChange={(e) => set("fach", e.target.value)} required disabled={busy} placeholder="z. B. Mathematik" /></div>
        <div><label>Zielstufe *</label><input value={s.stufe} onChange={(e) => set("stufe", e.target.value)} required disabled={busy} placeholder="z. B. Berufsmaturität" /></div>
      </div>
      <label>{pruefung ? "Prüfungsthema (optional – leer = der ganze Stoff aus dem Material)" : spiel ? "Spielthema (optional – leer = Begriffe und Regeln aus dem Material)" : "Thema (optional – leer = KI wählt aus dem Material)"}</label>
      <input value={s.thema} onChange={(e) => set("thema", e.target.value)} disabled={busy} placeholder={pruefung ? "z. B. Semesterprüfung Statistik" : spiel ? "z. B. Fachbegriffe Anatomie" : "z. B. Dosisberechnung"} />

      <label>{pruefung ? "Prüfungsstoff: Datei (PDF, Word, PowerPoint, Text · max. 4 MB)" : spiel ? "Spielinhalt: Datei (PDF, Word, PowerPoint, Text · max. 4 MB)" : "Material: Datei (PDF, Word, PowerPoint, Text · max. 4 MB)"}</label>
      <input type="file" ref={fileRef} accept=".pdf,.docx,.pptx,.txt,.md" disabled={busy} />
      <label>… oder Themenbeschreibung / Textauszug</label>
      <textarea rows={4} value={s.material} onChange={(e) => set("material", e.target.value)} disabled={busy} placeholder="Wird ignoriert, wenn eine Datei hochgeladen ist." />

      {pruefung ? (
        <>
          <label>Dauer der Übungsprüfung</label>
          <Seg k="dauer" opts={DAUER} />
          <p className="small-note" style={{ margin: ".3rem 0 0" }}>20 Minuten entsprechen 20 Punkten, 30 Minuten 30 Punkten, 45 Minuten 40 Punkten. Note nach Schweizer Skala, 60 Prozent ergibt eine 4.</p>
        </>
      ) : lernseite ? (
        <>
          <label>Differenzierungsart</label>
          <Seg k="diffart" opts={DIFFART} />
          <label>Anzahl Zugänge</label>
          <div className="seg">{[2, 3, 4].map((n) => <button type="button" key={n} className={s.anzahl === n ? "on" : ""} onClick={() => set("anzahl", n)} disabled={busy}>{n}</button>)}</div>
        </>
      ) : null}
      <label>Sprache</label>
      <Seg k="sprache" opts={SPRACHE} />
      {s.sprache === "zweisprachig" && (
        <input value={s.zweitsprache} onChange={(e) => set("zweitsprache", e.target.value)} disabled={busy} placeholder="Zweite Sprache, z. B. Portugiesisch" style={{ marginTop: ".4rem" }} />
      )}
      {lernseite && (
        <>
          <label>Twist in der Vertiefung</label>
          <Seg k="twist" opts={TWIST} />
          <label>Anforderungsniveau</label>
          <Seg k="niveau" opts={NIVEAU} />
        </>
      )}
      <label>Zusatzwunsch (optional)</label>
      <input value={s.extra} onChange={(e) => set("extra", e.target.value)} disabled={busy} placeholder={pruefung ? "z. B. ohne Taschenrechner, Schwerpunkt Formeln" : spiel ? "z. B. nur Fachbegriffe, Zeitlimit pro Aufgabe" : "z. B. Beispiel aus der Hotellerie"} />

      {bilder.length > 0 && lernseite && (
        <>
          <label>Bild einbinden (optional)</label>
          <select value={s.bild} onChange={(e) => set("bild", Number(e.target.value))} disabled={busy}>
            <option value={0}>kein Bild</option>
            {bilder.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          {s.bild > 0 && (
            <div className="row" style={{ alignItems: "center", marginTop: ".5rem" }}>
              <img src={`/app/bilder/${s.bild}/jpg`} alt="" style={{ width: 160, aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
              <span className="small-note" style={{ flex: "1 1 200px" }}>Das Bild kommt als Bildaufgabe mit Arbeitsauftrag in die Lernseite. Es wird dafür per Bildlink freigegeben (ohne Login erreichbar).</span>
            </div>
          )}
        </>
      )}

      <label>KI-Anbieter</label>
      <div className="seg">
        {providers.map((p) => (
          <button type="button" key={p.id} className={s.provider === p.id ? "on" : ""} onClick={() => set("provider", p.id)} disabled={busy} title={p.model}>{p.label}</button>
        ))}
      </div>

      {isAdmin && (
        <>
          <label htmlFor="modell" style={{ marginTop: ".8rem" }}>Modell (nur Admin, für Modelltests; leer = Standard)</label>
          <input id="modell" value={s.modell} onChange={(e) => set("modell", e.target.value)} disabled={busy} placeholder={current.model} />
          <p className="small-note" style={{ marginTop: ".3rem" }}>Exakter Modellname des gewählten Anbieters. Bei falschem Namen zeigt die Fehlermeldung die gültigen Namen.</p>
        </>
      )}

      {current.limit !== null && (
        <p className="small-note" style={{ marginTop: ".5rem", color: exhausted ? "var(--err)" : undefined }}>
          Diesen Monat {current.used} von {current.limit} Lernseiten mit {current.label} erzeugt.
          {exhausted ? " Das Kontingent ist aufgebraucht und wird am Monatsersten zurückgesetzt." : ""}
        </p>
      )}

      <div style={{ marginTop: "1.3rem", display: "flex", gap: ".8rem", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn terra" disabled={busy || exhausted}>{busy ? "Wird erzeugt …" : pruefung ? "Prüfungsvorbereitung erzeugen" : spiel ? "Lernspiel erzeugen" : "Lernseite erzeugen"}</button>
        {busy && <span className="small-note">Bitte Fenster offen lassen. Dauer: Lernseite ein bis drei Minuten, Prüfungsvorbereitung bis zu acht Minuten.</span>}
      </div>

      {error && <div className="msg err" style={{ marginTop: "1rem" }}>{error}</div>}
      {log.length > 0 && (
        <pre className="log">{log.join("\n")}</pre>
      )}
    </form>
  );
}
