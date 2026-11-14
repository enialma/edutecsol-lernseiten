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
  const id = `b-${String(k)}`;
  return (
    <div>
      <label htmlFor={id}>{label}{hint && <span className="hint"> {hint}</span>}</label>
      {rows ? (
        <textarea id={id} rows={rows} value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} disabled={busy} placeholder={ph} />
      ) : (
        <input id={id} value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} disabled={busy} placeholder={ph} />
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
    <form onSubmit={submit} className="bform">
      <fieldset className="fs">
        <legend>Schnellstart</legend>
        <p className="fs-lead">Ein Beispiel-Rezept übernehmen und anpassen.</p>
        <div className="seg">
          {presets.map((p) => (
            <button type="button" key={p.id} className={preset === p.id ? "on" : ""} aria-pressed={preset === p.id} onClick={() => { setS(presetState(p.id)); setPreset(p.id); }} disabled={busy}>{p.label}</button>
          ))}
          <button type="button" onClick={() => { setS({ ...BASE }); setPreset(null); }} disabled={busy}>Zurücksetzen</button>
        </div>
      </fieldset>

      <fieldset className="fs">
        <legend>1 · Planung</legend>
        <p className="mini-label" id="l-einsatz">Einsatz im Unterricht</p>
        <div className="seg" role="group" aria-labelledby="l-einsatz">
          {(Object.keys(EINSATZ_LABELS) as Einsatz[]).map((e) => (
            <button type="button" key={e} className={s.e === e ? "on" : ""} aria-pressed={s.e === e} onClick={() => set("e", e)} disabled={busy}>{EINSATZ_LABELS[e]}</button>
          ))}
        </div>
        <div className="form-grid">
          <Field s={s} set={set} busy={busy} k="thema" label="Unterrichtsthema" rows={2} ph="z. B. Arbeitsabläufe im Beruf" />
          <Field s={s} set={set} busy={busy} k="ziel" label="Die Lernenden sollen mit dem Bild …" rows={3} ph="… Beobachtungen von Vermutungen unterscheiden" />
        </div>
      </fieldset>

      <fieldset className="fs">
        <legend>2 · Bild beschreiben</legend>
        <div className="form-grid">
          <div>
            <label htmlFor="b-stil">Darstellungsstil</label>
            <select id="b-stil" value={s.stil} onChange={(e) => set("stil", e.target.value)} disabled={busy}>
              {STILE.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-persp">Perspektive / Ausschnitt</label>
            <select id="b-persp" value={s.persp} onChange={(e) => set("persp", e.target.value)} disabled={busy}>
              {PERSPEKTIVEN.map((v) => <option key={v} value={v}>{v || "– offen lassen –"}</option>)}
            </select>
          </div>
        </div>
        <Field s={s} set={set} busy={busy} k="motiv" label="Motiv" hint="Wer oder was ist zu sehen?" rows={2} ph="eine erwachsene, fiktive Person" />
        <Field s={s} set={set} busy={busy} k="handlung" label="Handlung" hint="Was passiert? Mehrere Zeilen möglich" rows={3} ph="formt einen Brotlaib" />
        <Field s={s} set={set} busy={busy} k="umgebung" label="Umgebung" hint="Wo findet die Szene statt?" ph="an einem Arbeitstisch in einer fiktiven Backstube" />
        <Field s={s} set={set} busy={busy} k="details" label="Wichtige sichtbare Details" hint="eines pro Zeile, möglichst nicht mehr als fünf" rows={3} />
        <Field s={s} set={set} busy={busy} k="platz" label="Platzierung" hint="optional, mehrere Zeilen möglich" rows={2} ph="Hauptmotiv rechts, links freie Fläche für Titel" />
        <Field s={s} set={set} busy={busy} k="licht" label="Licht und Farben" ph="helles, weiches Tageslicht; dezente Farben; ruhiger Hintergrund" />
      </fieldset>

      <fieldset className="fs">
        <legend>3 · Anforderungen</legend>
        <Field s={s} set={set} busy={busy} k="muss" label="Muss für die Aufgabe unbedingt sichtbar sein" ph="Hände, Teig und Werkzeuge vollständig sichtbar" />
        <p className="mini-label" id="l-aus">Ausschlüsse</p>
        <div className="xchecks" role="group" aria-labelledby="l-aus">
          {AUSSCHLUESSE.map((x) => (
            <label key={x} className="xcheck">
              <input type="checkbox" checked={s.x.includes(x)} onChange={() => toggleX(x)} disabled={busy} />{x}
            </label>
          ))}
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="b-format">Seitenverhältnis</label>
            <select id="b-format" value={s.format} onChange={(e) => set("format", e.target.value)} disabled={busy}>
              {FORMATE.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <p className="mini-label" id="l-qual">Qualität</p>
            <div className="seg" role="group" aria-labelledby="l-qual">
              <button type="button" className={quality === "medium" ? "on" : ""} aria-pressed={quality === "medium"} onClick={() => setQuality("medium")} disabled={busy}>Standard</button>
              <button type="button" className={quality === "high" ? "on" : ""} aria-pressed={quality === "high"} onClick={() => setQuality("high")} disabled={busy}>Hoch (langsamer)</button>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="fs">
        <legend>4 · Mein Bilder-Rezept</legend>
        <p className="fs-lead">Wird mit dem Bild gespeichert und erscheint auf der Bildseite als Planungstext.</p>
        <Field s={s} set={set} busy={busy} k="braucht" label="Dafür brauche ich eine Darstellung, die …" ph="… eine fiktive Arbeitssituation mit gut sichtbaren Werkzeugen zeigt" />
        <Field s={s} set={set} busy={busy} k="pruefe" label="Vor dem Einsatz prüfe ich, …" ph="… ob Tätigkeit und Werkzeuge fachlich stimmen" />
      </fieldset>

      <section className="bsum" aria-labelledby="h-bp">
        <h2 id="h-bp">Bildprompt</h2>
        <p className="bsum-note">Entsteht laufend aus deinen Angaben.</p>
        <pre className="prompt-box">{prompt}</pre>
        <p className="bsum-note">Arbeitsauftrag zu diesem Einsatz: «{TASKS[s.e]}»</p>
        {providers.length > 1 && (
          <>
            <p className="bsum-label" id="l-dienst">Bilddienst</p>
            <div className="seg" role="group" aria-labelledby="l-dienst">
              {providers.map((p) => (
                <button type="button" key={p.id} className={provider === p.id ? "on" : ""} aria-pressed={provider === p.id} onClick={() => setProvider(p.id)} disabled={busy} title={p.model}>{p.label}</button>
              ))}
            </div>
          </>
        )}
        {quota.limit !== null && (
          <p className={`bsum-note${exhausted ? " strong" : ""}`}>
            Diesen Monat {quota.used} von {quota.limit} Bildern erzeugt (Nachbessern zählt mit).
            {exhausted ? " Das Kontingent ist aufgebraucht und wird am Monatsersten zurückgesetzt." : ""}
          </p>
        )}
        <div className="form-acts">
          <button className="btn terra cta" disabled={busy || exhausted}>{busy ? "Bild wird erzeugt …" : "Bild erzeugen"}</button>
          {busy && <span className="bsum-note">Bitte Fenster offen lassen. Dauer 20 bis 90 Sekunden.</span>}
        </div>
        {error && <div className="msg err">{error}</div>}
      </section>
    </form>
  );
}
