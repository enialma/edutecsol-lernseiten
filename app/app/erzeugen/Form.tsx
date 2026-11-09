"use client";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { systemPrompt, userPrompt, type GenParams, type Typ } from "@/lib/prompt";
import { DIFFART_WAHL, EIGEN_PREFIX, INFO, MAX_EIGEN_LEN, MAX_EIGENE, SOZIALFORMEN, defaultZugaenge, zugangOptionen, type DiffartWahl, type InfoText } from "@/lib/achsen";

type ProviderOpt = { id: string; label: string; model: string; used: number; limit: number | null };
type Preset = { id: string; label: string; fach?: string; stufe?: string; diffart?: string; zugaenge?: string[]; sozialformen?: string[]; sprache?: string; twist?: string; niveau?: string };
type Bild = { id: number; title: string };

const TYP = [["lernseite", "Lernseite"], ["arbeitsblatt", "Arbeitsblatt"], ["pruefung", "Prüfungsvorbereitung"], ["spiel", "Lernspiel"], ["hilfe", "Lernhilfe"]];
const DAUER = [["20", "20 Minuten"], ["30", "30 Minuten"], ["45", "45 Minuten"]];
const DIFFART = [["niveau", "nach Niveau (Hilfe)"], ["lerntyp", "nach Lerntyp"], ["interesse", "nach Berufsfeld"]];
const SOZIAL = SOZIALFORMEN.map((o) => [o.v, o.name]);
const SPRACHE = [["standard", "Standard"], ["einfach", "vereinfachte Sprache"], ["glossar", "Fachbegriffe mit Glossar"], ["zweisprachig", "Schlüsselbegriffe zweisprachig"]];
const TWIST = [["auto", "passend wählen"], ["ausreisser", "Ausreisser/Robustheit"], ["vergleich", "Fälle vergleichen"], ["grenzfall", "Grenzfall"], ["fehler", "Fehler erkennen"], ["methoden", "Methoden vergleichen"], ["transfer", "Transfer/Anwendung"]];
const NIVEAU = [["reproduzieren", "reproduzieren"], ["anwenden", "anwenden"], ["beurteilen", "beurteilen"]];

type State = {
  typ: string; dauer: string;
  fach: string; stufe: string; thema: string; extra: string; material: string;
  diffart: DiffartWahl; zugaenge: string[]; eigeneBerufsfelder: string[]; sozialformen: string[];
  sprache: string; zweitsprache: string; twist: string; niveau: string; provider: string; bild: number; modell: string;
  aufgaben: string; aufgabenText: string; latex: boolean;
};

/** Erklärzeilen für einen Info-Kreis aus den Knopf-Optionen und den Texten in lib/achsen.ts. */
const infoItems = (info: InfoText, opts: string[][]): [string, string][] => opts.map(([v, l]) => [l, info.opts[v] ?? ""]);

// ---------- Bausteine (auf Modulebene, damit sie beim Tippen nicht neu erzeugt werden und den Fokus behalten) ----------

/** Einfachauswahl als Knopfreihe. */
function Seg({ value, opts, onPick, disabled }: { value: string; opts: string[][]; onPick: (v: string) => void; disabled: boolean }) {
  return (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button type="button" key={v} className={value === v ? "on" : ""} onClick={() => onPick(v)} disabled={disabled}>{l}</button>
      ))}
    </div>
  );
}

/** Mehrfachauswahl als Knopfreihe; der letzte gewählte Wert lässt sich nicht abwählen. Reihenfolge wie in opts. */
function MultiSeg({ value, opts, onChange, disabled }: { value: string[]; opts: string[][]; onChange: (v: string[]) => void; disabled: boolean }) {
  const toggle = (v: string) => {
    const was = value.includes(v);
    if (was && value.length <= 1) return;
    onChange(opts.map(([x]) => x).filter((x) => (x === v ? !was : value.includes(x))));
  };
  return (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button type="button" key={v} className={value.includes(v) ? "on" : ""} aria-pressed={value.includes(v)} onClick={() => toggle(v)} disabled={disabled}>{l}</button>
      ))}
    </div>
  );
}

/** Info-Kreis rechts neben einer Überschrift: Erklärung nur beim Darüberfahren, nicht klickbar (Tastatur: beim Fokus). */
function InfoKreis({ id, title, items, note }: { id: string; title: string; items: [string, string][]; note?: string }) {
  return (
    <div className="info-wrap">
      <span className="info-btn" tabIndex={0} role="note" aria-label={`Erklärung zu «${title}»`} aria-describedby={id}>i</span>
      <div className="info-box" id={id} role="tooltip">
        <dl>{items.map(([dt, dd]) => <Fragment key={dt}><dt>{dt}</dt><dd>{dd}</dd></Fragment>)}</dl>
        {note && <p>{note}</p>}
      </div>
    </div>
  );
}

/** Überschrift eines Feldes mit optionalem Info-Kreis am rechten Rand. */
function FieldHead({ label, htmlFor, info, first, gross }: { label: string; htmlFor?: string; info?: ReactNode; first?: boolean; gross?: boolean }) {
  return (
    <div className="field-head" style={first ? { marginTop: 0 } : undefined}>
      <label htmlFor={htmlFor} className={gross ? "head-gross" : undefined}>{label}</label>
      {info}
    </div>
  );
}

/** Zugänge passend zur Differenzierungsart (Mehrfachauswahl, mindestens einer); bei Berufsfeld mit «+» für eigene Felder. */
function ZugangWahl({ diffart, gewaehlt, eigene, onChange, disabled }: {
  diffart: DiffartWahl; gewaehlt: string[]; eigene: string[];
  onChange: (zugaenge: string[], eigene: string[]) => void; disabled: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [text, setText] = useState("");
  const opts = zugangOptionen(diffart, eigene);
  const berufsfeld = diffart === "interesse";

  const toggle = (v: string) => {
    const was = gewaehlt.includes(v);
    if (was && gewaehlt.length <= 1) return;
    // Reihenfolge der Skala beibehalten, damit A, B, C … der Stufung folgen
    onChange(opts.map((o) => o.v).filter((x) => (x === v ? !was : gewaehlt.includes(x))), eigene);
  };
  const add = () => {
    const name = text.trim().slice(0, MAX_EIGEN_LEN);
    if (!name || eigene.length >= MAX_EIGENE || opts.some((o) => o.name.toLowerCase() === name.toLowerCase())) return;
    const neu = [...eigene, name];
    // Ein neues Feld ist sofort gewählt
    onChange(zugangOptionen(diffart, neu).map((o) => o.v).filter((x) => x === EIGEN_PREFIX + name || gewaehlt.includes(x)), neu);
    setText("");
    if (neu.length >= MAX_EIGENE) setAddOpen(false);
  };
  const remove = (name: string) => {
    const rest = gewaehlt.filter((x) => x !== EIGEN_PREFIX + name);
    if (!rest.length) return; // mindestens ein Zugang bleibt
    onChange(rest, eigene.filter((n) => n !== name));
  };

  return (
    <>
      <div className="seg">
        {opts.map((o) => (
          <Fragment key={o.v}>
            <button type="button" className={gewaehlt.includes(o.v) ? "on" : ""} aria-pressed={gewaehlt.includes(o.v)} onClick={() => toggle(o.v)} disabled={disabled}>{o.name}</button>
            {o.v.startsWith(EIGEN_PREFIX) && (
              <button type="button" className="del-btn" aria-label={`«${o.name}» entfernen`} onClick={() => remove(o.name)} disabled={disabled}>×</button>
            )}
          </Fragment>
        ))}
        {berufsfeld && eigene.length < MAX_EIGENE && (
          <button type="button" className="add-btn" aria-label="Eigenes Berufsfeld hinzufügen" aria-expanded={addOpen} aria-controls="eigenes-feld" onClick={() => setAddOpen((o) => !o)} disabled={disabled}>+</button>
        )}
      </div>
      {berufsfeld && addOpen && eigene.length < MAX_EIGENE && (
        <div className="add-row" id="eigenes-feld">
          <input
            value={text} maxLength={MAX_EIGEN_LEN} autoFocus disabled={disabled}
            aria-label="Eigenes Berufsfeld" placeholder="z. B. Landwirtschaft, Logistik, Kosmetik"
            onChange={(e) => setText(e.target.value)}
            // Enter fügt hinzu, statt das ganze Formular abzuschicken
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } if (e.key === "Escape") setAddOpen(false); }}
          />
          <button type="button" className="btn small ghost" onClick={add} disabled={disabled}>Hinzufügen</button>
        </div>
      )}
    </>
  );
}

/** Einstellungen wie im Server (app/api/erzeugen/route.ts) zu GenParams; Achsen nur bei Lernseite und Arbeitsblatt. */
function paramsAus(s: State): GenParams {
  const typ = s.typ as Typ;
  const n = Number(s.aufgaben);
  const p: GenParams = {
    typ, dauer: (Number(s.dauer) === 20 ? 20 : Number(s.dauer) === 45 ? 45 : 30) as 20 | 30 | 45,
    fach: s.fach.trim(), stufe: s.stufe.trim(), thema: s.thema.trim(), extra: s.extra.trim(),
    diffart: s.diffart, sprache: s.sprache as GenParams["sprache"], zweitsprache: s.zweitsprache.trim(),
    twist: s.twist as GenParams["twist"], niveau: s.niveau as GenParams["niveau"],
  };
  if (typ === "lernseite" || typ === "arbeitsblatt") {
    p.zugaenge = s.zugaenge;
    p.sozialformen = s.sozialformen as GenParams["sozialformen"];
    if (s.diffart === "interesse" && s.eigeneBerufsfelder.length) p.eigeneBerufsfelder = s.eigeneBerufsfelder;
    if (Number.isInteger(n) && n >= 1 && n <= 12) p.aufgaben = n;
    if (s.aufgabenText.trim()) p.aufgabenText = s.aufgabenText.trim();
    if (s.latex) p.latex = true;
  }
  return p;
}

/** Zeigt den Prompt, den der Server mit diesen Einstellungen an die KI schicken würde. */
function PromptVorschau({ s, hatDatei }: { s: State; hatDatei: boolean }) {
  const p = paramsAus(s);
  // Ein gewähltes Bild bekommt erst beim Erzeugen seinen öffentlichen Link
  if (s.bild > 0 && (p.typ === "lernseite" || p.typ === "arbeitsblatt")) p.bild = { id: s.bild, url: "[Bildlink wird beim Erzeugen eingesetzt]", title: "gewähltes Bild", auftrag: "[Arbeitsauftrag passend zum Bildeinsatz]", alt: "KI-generierte Illustration" };
  // Eine Datei liest erst der Server aus; in der Vorschau steht dafür ein Platzhalter
  const material = hatDatei
    ? { name: "Datei", text: "[Text der hochgeladenen Datei wird beim Erzeugen ausgelesen und hier eingefügt]" }
    : s.material.trim() ? { name: "", text: s.material } : null;
  return (
    <div id="generierter-prompt" style={{ marginTop: ".6rem" }}>
      <p className="small-note" style={{ margin: "0 0 .4rem" }}>So geht der Auftrag mit den aktuellen Einstellungen an die KI. Er ändert sich, wenn du oben etwas umstellst.</p>
      <pre className="prompt-box">{userPrompt(p, material)}</pre>
      <details style={{ marginTop: ".5rem" }}>
        <summary style={{ cursor: "pointer" }} className="small-note">Feste Regeln und Designbasis (System-Prompt)</summary>
        <pre className="prompt-box" style={{ marginTop: ".4rem" }}>{systemPrompt(p.typ)}</pre>
      </details>
    </div>
  );
}

export default function Form({ providers, presets, bilder, initialBild, isAdmin }: { providers: ProviderOpt[]; presets: Preset[]; bilder: Bild[]; initialBild: number; isAdmin: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [s, setS] = useState<State>({
    typ: "lernseite", dauer: "30",
    fach: "", stufe: "", thema: "", extra: "", material: "",
    diffart: "niveau", zugaenge: defaultZugaenge("niveau"), eigeneBerufsfelder: [], sozialformen: ["einzel"],
    sprache: "standard", zweitsprache: "", twist: "auto", niveau: "anwenden",
    provider: (providers.find((p) => p.limit === null || p.used < p.limit) ?? providers[0]).id,
    bild: bilder.some((b) => b.id === initialBild) ? initialBild : 0,
    modell: "",
    aufgaben: "", aufgabenText: "", latex: false,
  });
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [hatDatei, setHatDatei] = useState(false);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const pruefung = s.typ === "pruefung";
  const spiel = s.typ === "spiel";
  const hilfe = s.typ === "hilfe";
  const arbeitsblatt = s.typ === "arbeitsblatt";
  // Lernseite und Arbeitsblatt teilen sich die didaktischen Achsen
  const lernseite = !pruefung && !spiel && !hilfe;

  function applyPreset(p: Preset) {
    setS((prev) => {
      const diffart = (DIFFART_WAHL as string[]).includes(p.diffart ?? "") ? (p.diffart as DiffartWahl) : prev.diffart;
      return {
        ...prev, thema: "", extra: "", aufgaben: "", aufgabenText: "",
        fach: p.fach ?? prev.fach, stufe: p.stufe ?? prev.stufe, diffart,
        zugaenge: p.zugaenge ?? defaultZugaenge(diffart), sozialformen: p.sozialformen ?? ["einzel"],
        sprache: p.sprache ?? prev.sprache, twist: p.twist ?? prev.twist, niveau: p.niveau ?? prev.niveau,
      };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLog([]);
    setBusy(true);
    const fd = new FormData();
    // Mehrfachwerte (Zugänge, eigene Berufsfelder, Sozialformen) als JSON
    Object.entries(s).forEach(([k, v]) => fd.set(k, Array.isArray(v) ? JSON.stringify(v) : String(v)));
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
  // Sprache: bei Lernseite und Arbeitsblatt in der Feinsteuerung, bei den anderen Typen direkt sichtbar
  const sprache = (
    <>
      <FieldHead label="Sprache" info={<InfoKreis id="info-sprache" title="Sprache" items={infoItems(INFO.sprache, SPRACHE)} />} />
      <Seg value={s.sprache} opts={SPRACHE} onPick={(v) => set("sprache", v)} disabled={busy} />
      {s.sprache === "zweisprachig" && (
        <input value={s.zweitsprache} onChange={(e) => set("zweitsprache", e.target.value)} disabled={busy} placeholder="Zweite Sprache, z. B. Portugiesisch" style={{ marginTop: ".4rem" }} />
      )}
    </>
  );
  const exhausted = current.limit !== null && current.used >= current.limit;

  return (
    <form onSubmit={submit} className="card">
      <FieldHead first gross label="Was soll entstehen?" info={<InfoKreis id="info-typ" title="Was soll entstehen?" items={infoItems(INFO.typ, TYP)} note={INFO.typ.note} />} />
      <Seg value={s.typ} opts={TYP} onPick={(v) => set("typ", v)} disabled={busy} />
      <p className="small-note" style={{ margin: ".4rem 0 .2rem" }}>
        {pruefung
          ? "Aus dem Prüfungsstoff entstehen drei Teile: Lernziele checken, Übungsprüfung mit Timer und Note, Lücken schliessen mit Lernplan. Dazu ein Lehrpersonen-Bereich mit Lösungen und Punkteschlüssel."
          : spiel
            ? "Vier Levels (Erkennen, Erinnern, Anwenden, Meistern) mit 24 bis 28 Aufgaben aus dem Material, Punkten, Serie, Leben und Bestleistung. Dazu die Aufgabenliste für die Lehrperson."
            : hilfe
              ? "Merkblatt auf einer A4-Seite, 16 bis 24 Lernkarten zum Umdrehen mit Gewusst/Nochmals, Glossar mit Suche. Alles druckbar. Mit «vereinfachte Sprache» oder «zweisprachig» auch als Nachteilsausgleich."
              : arbeitsblatt
                ? "Ein Arbeitsblatt zum Austeilen: Kernaufgabe und Zugänge untereinander, jeder Zugang auf einer neuen Seite, mit Platz zum Bearbeiten und Lösungsblatt. Als Word herunterladen oder drucken."
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
      <input type="file" ref={fileRef} accept=".pdf,.docx,.pptx,.txt,.md" disabled={busy} onChange={(e) => setHatDatei(!!e.target.files?.length)} />
      <label>… oder Themenbeschreibung / Textauszug</label>
      <textarea rows={4} value={s.material} onChange={(e) => set("material", e.target.value)} disabled={busy} placeholder="Wird ignoriert, wenn eine Datei hochgeladen ist." />

      {pruefung ? (
        <>
          <label>Dauer der Übungsprüfung</label>
          <Seg value={s.dauer} opts={DAUER} onPick={(v) => set("dauer", v)} disabled={busy} />
          <p className="small-note" style={{ margin: ".3rem 0 0" }}>20 Minuten entsprechen 20 Punkten, 30 Minuten 30 Punkten, 45 Minuten 40 Punkten. Note nach Schweizer Skala, 60 Prozent ergibt eine 4.</p>
        </>
      ) : lernseite ? (
        <>
          <FieldHead label="Differenzierungsart" info={<InfoKreis id="info-diffart" title="Differenzierungsart" items={infoItems(INFO.diffart, DIFFART)} note={INFO.diffart.note} />} />
          <Seg
            value={s.diffart} opts={DIFFART} disabled={busy}
            onPick={(v) => setS((p) => (p.diffart === v ? p : { ...p, diffart: v as DiffartWahl, zugaenge: defaultZugaenge(v as DiffartWahl) }))}
          />
          <FieldHead
            label="Zugänge (Mehrfachauswahl, mindestens einer)"
            info={<InfoKreis id="info-zugaenge" title="Zugänge" items={zugangOptionen(s.diffart, s.eigeneBerufsfelder).map((o) => [o.name, o.info])} note={INFO.zugaenge.note} />}
          />
          <ZugangWahl
            diffart={s.diffart} gewaehlt={s.zugaenge} eigene={s.eigeneBerufsfelder} disabled={busy}
            onChange={(zugaenge, eigeneBerufsfelder) => setS((p) => ({ ...p, zugaenge, eigeneBerufsfelder }))}
          />
          <FieldHead label="Sozialform (Mehrfachauswahl, mindestens eine)" info={<InfoKreis id="info-sozialform" title="Sozialform" items={infoItems(INFO.sozialform, SOZIAL)} note={INFO.sozialform.note} />} />
          <MultiSeg value={s.sozialformen} opts={SOZIAL} onChange={(v) => set("sozialformen", v)} disabled={busy} />
        </>
      ) : null}
      {!lernseite && sprache}
      {lernseite && (
        <>
          <FieldHead label="Anforderungsniveau" info={<InfoKreis id="info-niveau" title="Anforderungsniveau" items={infoItems(INFO.niveau, NIVEAU)} />} />
          <Seg value={s.niveau} opts={NIVEAU} onPick={(v) => set("niveau", v)} disabled={busy} />
          <details style={{ marginTop: ".9rem" }}>
            <summary className="head-gross" style={{ cursor: "pointer", fontWeight: 600 }}>Feinsteuerung</summary>
            {sprache}
            <FieldHead label="Twist" info={<InfoKreis id="info-twist" title="Twist" items={infoItems(INFO.twist, TWIST)} note={INFO.twist.note} />} />
            <Seg value={s.twist} opts={TWIST} onPick={(v) => set("twist", v)} disabled={busy} />
            <label htmlFor="aufgaben">Anzahl Aufgaben pro Zugang (leer = KI entscheidet)</label>
            <input id="aufgaben" type="number" min={1} max={12} step={1} inputMode="numeric" value={s.aufgaben} onChange={(e) => set("aufgaben", e.target.value)} disabled={busy} placeholder="automatisch" style={{ maxWidth: "9rem" }} />
            <label htmlFor="aufgabenText">Aufgaben beschreiben</label>
            <textarea id="aufgabenText" rows={3} maxLength={2000} value={s.aufgabenText} onChange={(e) => set("aufgabenText", e.target.value)} disabled={busy} placeholder="z. B. 1. Dichte aus Masse und Volumen berechnen, 2. Stoffe anhand der Dichte bestimmen, 3. Fehler in einer Rechnung finden" />
            <label style={{ display: "flex", alignItems: "center", gap: ".5rem", fontWeight: 400, cursor: "pointer" }}>
              <input type="checkbox" checked={s.latex} onChange={(e) => set("latex", e.target.checked)} disabled={busy} style={{ width: "auto", margin: 0 }} />
              Formeln in LaTeX (für Mathematik und Physik)
            </label>
          </details>
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

      <button type="button" className="prompt-link" aria-expanded={promptOpen} aria-controls="generierter-prompt" onClick={() => setPromptOpen((o) => !o)} style={{ marginTop: "1.1rem" }}>
        {promptOpen ? "Generierten Prompt ausblenden" : "Generierter Prompt"}
      </button>
      {promptOpen && <PromptVorschau s={s} hatDatei={hatDatei} />}

      <div style={{ marginTop: "1.3rem", display: "flex", gap: ".8rem", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn terra" disabled={busy || exhausted}>{busy ? "Wird erzeugt …" : pruefung ? "Prüfungsvorbereitung erzeugen" : spiel ? "Lernspiel erzeugen" : hilfe ? "Lernhilfe erzeugen" : arbeitsblatt ? "Arbeitsblatt erzeugen" : "Lernseite erzeugen"}</button>
        {busy && <span className="small-note">Bitte Fenster offen lassen. Dauer: Lernseite ein bis drei Minuten, Prüfungsvorbereitung bis zu acht Minuten.</span>}
      </div>

      {error && <div className="msg err" style={{ marginTop: "1rem" }}>{error}</div>}
      {log.length > 0 && (
        <pre className="log">{log.join("\n")}</pre>
      )}
    </form>
  );
}
