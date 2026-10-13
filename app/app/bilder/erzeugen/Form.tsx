"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUSSCHLUESSE, BASE, EINSATZ_LABELS, FORMATE, PERSPEKTIVEN, STILE, TASKS, buildPrompt, decodeState, presetState,
  type BildState, type Einsatz,
} from "@/lib/bildprompt";

type ProviderOpt = { id: string; label: string; model: string };
type Preset = { id: string; label: string };
type Quota = { used: number; limit: number | null };

type FieldProps = {
  k: keyof BildState; label: string; hint?: string; rows?: number; ph?: string;
  s: BildState; set: (k: keyof BildState, v: never) => void; busy: boolean;
};

function Field({ k, label, hint, rows, ph, s, set, busy }: FieldProps) {
  return (
    <div>
      <label>{label}{hint && <span className="small-note" style={{ fontWeight: 400 }}> {hint}</span>}</label>
      {rows ? (
        <textarea rows={rows} value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} disabled={busy} placeholder={ph} style={{ minHeight: 0 }} />
      ) : (
        <input value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} disabled={busy} placeholder={ph} />
      )}
    </div>
  );
}

export default function Form({ providers, presets, quota, initial }: { providers: ProviderOpt[]; presets: Preset[]; quota: Quota; initial: string | null }) {
  const router = useRouter();
  const [s, setS] = useState<BildState>(() => (initial && decodeState(initial)) || presetState("backstube"));
  const [provider, setProvider] = useState(providers[0].id);
  const [quality, setQuality] = useState<"medium" | "high">("medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string | null>(initial ? null : "backstube");
  const set = <K extends keyof BildState>(k: K, v: BildState[K]) => { setPreset(null); setS((p) => ({ ...p, [k]: v })); };
  const toggleX = (x: string) => set("x", s.x.includes(x) ? s.x.filter((v) => v !== x) : [...s.x, x]);

  // Teilen-Link des kostenlosen Generators (#r=…) ebenfalls annehmen
  useEffect(() => {
    const m = location.hash.match(/^#r=(.+)$/);
    if (m) { const d = decodeState(m[1]); if (d) { setS(d); setPreset(null); } }
  }, []);

  const prompt = useMemo(() => buildPrompt(s), [s]);
  const exhausted = quota.limit !== null && quota.used >= quota.limit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/bilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: s, provider, quality }) });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/app/bilder/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }


  return (
    <form onSubmit={submit} className="card">
      <div className="row" style={{ marginBottom: ".6rem", alignItems: "center" }}>
        <span className="small-note">Schnellstart:</span>
        {presets.map((p) => (
          <button type="button" key={p.id} className={`btn small ${preset === p.id ? "" : "ghost"}`} onClick={() => { setS(presetState(p.id)); setPreset(p.id); }} disabled={busy}>{p.label}</button>
        ))}
        <button type="button" className="btn small ghost" onClick={() => { setS({ ...BASE }); setPreset(null); }} disabled={busy}>Zurücksetzen</button>
      </div>

      <h3 style={{ margin: "1rem 0 .2rem" }}>1 · Planung</h3>
      <label>Einsatz im Unterricht</label>
      <div className="seg">
        {(Object.keys(EINSATZ_LABELS) as Einsatz[]).map((e) => (
          <button type="button" key={e} className={s.e === e ? "on" : ""} onClick={() => set("e", e)} disabled={busy}>{EINSATZ_LABELS[e]}</button>
        ))}
      </div>
      <div className="form-grid">
        <Field s={s} set={set} busy={busy} k="thema" label="Unterrichtsthema" rows={2} ph="z. B. Arbeitsabläufe im Beruf" />
        <Field s={s} set={set} busy={busy} k="ziel" label="Die Lernenden sollen mit dem Bild …" rows={3} ph="… Beobachtungen von Vermutungen unterscheiden" />
      </div>

      <h3 style={{ margin: "1.4rem 0 .2rem" }}>2 · Bild beschreiben</h3>
      <label>Darstellungsstil</label>
      <select value={s.stil} onChange={(e) => set("stil", e.target.value)} disabled={busy}>
        {STILE.map((v) => <option key={v}>{v}</option>)}
      </select>
      <Field s={s} set={set} busy={busy} k="motiv" label="Motiv" hint="Wer oder was ist zu sehen?" rows={2} ph="eine erwachsene, fiktive Person" />
      <Field s={s} set={set} busy={busy} k="handlung" label="Handlung" hint="Was passiert? Mehrere Zeilen möglich" rows={3} ph="formt einen Brotlaib" />
      <Field s={s} set={set} busy={busy} k="umgebung" label="Umgebung" hint="Wo findet die Szene statt?" ph="an einem Arbeitstisch in einer fiktiven Backstube" />
      <Field s={s} set={set} busy={busy} k="details" label="Wichtige sichtbare Details" hint="eines pro Zeile, möglichst nicht mehr als fünf" rows={3} />
      <label>Perspektive / Ausschnitt</label>
      <select value={s.persp} onChange={(e) => set("persp", e.target.value)} disabled={busy}>
        {PERSPEKTIVEN.map((v) => <option key={v} value={v}>{v || "– offen lassen –"}</option>)}
      </select>
      <Field s={s} set={set} busy={busy} k="platz" label="Platzierung" hint="optional, mehrere Zeilen möglich" rows={2} ph="Hauptmotiv rechts, links freie Fläche für Titel" />
      <Field s={s} set={set} busy={busy} k="licht" label="Licht und Farben" ph="helles, weiches Tageslicht; dezente Farben; ruhiger Hintergrund" />

      <h3 style={{ margin: "1.4rem 0 .2rem" }}>3 · Anforderungen</h3>
      <Field s={s} set={set} busy={busy} k="muss" label="Muss für die Aufgabe unbedingt sichtbar sein" ph="Hände, Teig und Werkzeuge vollständig sichtbar" />
      <label>Ausschlüsse</label>
      <div className="row" style={{ gap: ".4rem 1rem" }}>
        {AUSSCHLUESSE.map((x) => (
          <label key={x} style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", margin: 0, fontWeight: 400, fontSize: ".88rem", cursor: "pointer" }}>
            <input type="checkbox" checked={s.x.includes(x)} onChange={() => toggleX(x)} disabled={busy} style={{ width: "auto", margin: 0 }} />{x}
          </label>
        ))}
      </div>
      <div className="form-grid">
        <div>
          <label>Seitenverhältnis</label>
          <select value={s.format} onChange={(e) => set("format", e.target.value)} disabled={busy}>
            {FORMATE.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label>Qualität</label>
          <div className="seg">
            <button type="button" className={quality === "medium" ? "on" : ""} onClick={() => setQuality("medium")} disabled={busy}>Standard</button>
            <button type="button" className={quality === "high" ? "on" : ""} onClick={() => setQuality("high")} disabled={busy}>Hoch (langsamer)</button>
          </div>
        </div>
      </div>

      <h3 style={{ margin: "1.4rem 0 .2rem" }}>4 · Mein Bilder-Rezept</h3>
      <p className="small-note" style={{ margin: 0 }}>Wird mit dem Bild gespeichert und erscheint auf der Bildseite als Planungstext.</p>
      <Field s={s} set={set} busy={busy} k="braucht" label="Dafür brauche ich eine Darstellung, die …" ph="… eine fiktive Arbeitssituation mit gut sichtbaren Werkzeugen zeigt" />
      <Field s={s} set={set} busy={busy} k="pruefe" label="Vor dem Einsatz prüfe ich, …" ph="… ob Tätigkeit und Werkzeuge fachlich stimmen" />

      {providers.length > 1 && (
        <>
          <label>Bilddienst</label>
          <div className="seg">
            {providers.map((p) => (
              <button type="button" key={p.id} className={provider === p.id ? "on" : ""} onClick={() => setProvider(p.id)} disabled={busy} title={p.model}>{p.label}</button>
            ))}
          </div>
        </>
      )}

      <label>Bildprompt (entsteht aus deinen Angaben)</label>
      <pre className="prompt-box">{prompt}</pre>
      <p className="small-note" style={{ marginTop: ".4rem" }}>Arbeitsauftrag zu diesem Einsatz: «{TASKS[s.e]}»</p>

      {quota.limit !== null && (
        <p className="small-note" style={{ marginTop: ".6rem", color: exhausted ? "var(--err)" : undefined }}>
          Diesen Monat {quota.used} von {quota.limit} Bildern erzeugt (Nachbessern zählt mit).
          {exhausted ? " Das Kontingent ist aufgebraucht und wird am Monatsersten zurückgesetzt." : ""}
        </p>
      )}

      <div style={{ marginTop: "1.3rem", display: "flex", gap: ".8rem", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn terra" disabled={busy || exhausted}>{busy ? "Bild wird erzeugt …" : "Bild erzeugen"}</button>
        {busy && <span className="small-note">Bitte Fenster offen lassen. Dauer 20 bis 90 Sekunden.</span>}
      </div>
      {error && <div className="msg err" style={{ marginTop: "1rem" }}>{error}</div>}
    </form>
  );
}
