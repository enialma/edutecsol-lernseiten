"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderOpt = { id: string; label: string; model: string };
type Preset = { id: string; label: string; fach?: string; stufe?: string; diffart?: string; anzahl?: number; sprache?: string; twist?: string; niveau?: string };

const DIFFART = [["niveau", "nach Niveau (Hilfe)"], ["lerntyp", "nach Lerntyp"], ["interesse", "nach Berufsfeld"], ["sozialform", "nach Sozialform"]];
const SPRACHE = [["standard", "Standard"], ["einfach", "vereinfachte Sprache"], ["glossar", "Fachbegriffe mit Glossar"], ["zweisprachig", "Schlüsselbegriffe zweisprachig"]];
const TWIST = [["auto", "passend wählen"], ["ausreisser", "Ausreisser/Robustheit"], ["vergleich", "Fälle vergleichen"], ["grenzfall", "Grenzfall"], ["fehler", "Fehler erkennen"], ["methoden", "Methoden vergleichen"], ["transfer", "Transfer/Anwendung"]];
const NIVEAU = [["reproduzieren", "reproduzieren"], ["anwenden", "anwenden"], ["beurteilen", "beurteilen"]];

type State = {
  fach: string; stufe: string; thema: string; extra: string; material: string;
  diffart: string; anzahl: number; sprache: string; zweitsprache: string; twist: string; niveau: string; provider: string;
};

export default function Form({ providers, presets }: { providers: ProviderOpt[]; presets: Preset[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [s, setS] = useState<State>({
    fach: "", stufe: "", thema: "", extra: "", material: "",
    diffart: "niveau", anzahl: 3, sprache: "standard", zweitsprache: "", twist: "auto", niveau: "anwenden",
    provider: providers[0].id,
  });
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof State, v: string | number) => setS((p) => ({ ...p, [k]: v }));

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

  const Seg = ({ k, opts }: { k: keyof State; opts: string[][] }) => (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button type="button" key={v} className={s[k] === v ? "on" : ""} onClick={() => set(k, v)} disabled={busy}>{l}</button>
      ))}
    </div>
  );

  return (
    <form onSubmit={submit} className="card">
      <div className="row" style={{ marginBottom: ".6rem", alignItems: "center" }}>
        <span className="small-note">Schnellstart:</span>
        {presets.map((p) => <button type="button" key={p.id} className="btn small ghost" onClick={() => applyPreset(p)} disabled={busy}>{p.label}</button>)}
      </div>

      <div className="form-grid">
        <div><label>Fach / Kontext *</label><input value={s.fach} onChange={(e) => set("fach", e.target.value)} required disabled={busy} placeholder="z. B. Mathematik" /></div>
        <div><label>Zielstufe *</label><input value={s.stufe} onChange={(e) => set("stufe", e.target.value)} required disabled={busy} placeholder="z. B. Berufsmaturität" /></div>
      </div>
      <label>Thema (optional – leer = KI wählt aus dem Material)</label>
      <input value={s.thema} onChange={(e) => set("thema", e.target.value)} disabled={busy} placeholder="z. B. Dosisberechnung" />

      <label>Material: Datei (PDF, Word, PowerPoint, Text · max. 4 MB)</label>
      <input type="file" ref={fileRef} accept=".pdf,.docx,.pptx,.txt,.md" disabled={busy} />
      <label>… oder Themenbeschreibung / Textauszug</label>
      <textarea rows={4} value={s.material} onChange={(e) => set("material", e.target.value)} disabled={busy} placeholder="Wird ignoriert, wenn eine Datei hochgeladen ist." />

      <label>Differenzierungsart</label>
      <Seg k="diffart" opts={DIFFART} />
      <label>Anzahl Zugänge</label>
      <div className="seg">{[2, 3, 4].map((n) => <button type="button" key={n} className={s.anzahl === n ? "on" : ""} onClick={() => set("anzahl", n)} disabled={busy}>{n}</button>)}</div>
      <label>Sprache</label>
      <Seg k="sprache" opts={SPRACHE} />
      {s.sprache === "zweisprachig" && (
        <input value={s.zweitsprache} onChange={(e) => set("zweitsprache", e.target.value)} disabled={busy} placeholder="Zweite Sprache, z. B. Portugiesisch" style={{ marginTop: ".4rem" }} />
      )}
      <label>Twist in der Vertiefung</label>
      <Seg k="twist" opts={TWIST} />
      <label>Anforderungsniveau</label>
      <Seg k="niveau" opts={NIVEAU} />
      <label>Zusatzwunsch (optional)</label>
      <input value={s.extra} onChange={(e) => set("extra", e.target.value)} disabled={busy} placeholder="z. B. Beispiel aus der Hotellerie" />

      <label>KI-Anbieter</label>
      <div className="seg">
        {providers.map((p) => (
          <button type="button" key={p.id} className={s.provider === p.id ? "on" : ""} onClick={() => set("provider", p.id)} disabled={busy} title={p.model}>{p.label}</button>
        ))}
      </div>

      <div style={{ marginTop: "1.3rem", display: "flex", gap: ".8rem", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn terra" disabled={busy}>{busy ? "Wird erzeugt …" : "Lernseite erzeugen"}</button>
        {busy && <span className="small-note">Bitte Fenster offen lassen. Dauer ein bis drei Minuten.</span>}
      </div>

      {error && <div className="msg err" style={{ marginTop: "1rem" }}>{error}</div>}
      {log.length > 0 && (
        <pre className="log">{log.join("\n")}</pre>
      )}
    </form>
  );
}
