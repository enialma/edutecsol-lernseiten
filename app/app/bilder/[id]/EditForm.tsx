"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditForm({ imageId, suggestions, canEdit, swissOnly = false, exhausted }: { imageId: number; suggestions: string[]; canEdit: boolean; swissOnly?: boolean; exhausted: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/bilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId: imageId, instruction: text.trim(), quality: "medium" }) });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/app/bilder/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  if (!canEdit) return <p className="small-note">{swissOnly ? "Nachbessern läuft über OpenAI (USA) und ist an deiner Schule ausgeschaltet. Passe stattdessen das Rezept an und erzeuge neu." : "Nachbessern braucht den Bilddienst OpenAI (nicht konfiguriert)."}</p>;

  return (
    <form onSubmit={submit} className="nb-form">
      <p className="box-text soft">Eine Sache pro Schritt. Klick auf einen Vorschlag übernimmt ihn ins Feld; du kannst ihn anpassen. Jede Nachbesserung wird als neue Variante gespeichert.</p>
      <div className="fixes" role="group" aria-label="Vorschläge">
        {suggestions.map((t) => <button type="button" key={t} onClick={() => setText(t)} disabled={busy}>{t}</button>)}
      </div>
      <label htmlFor="nb-text" className="sr">Änderungsauftrag</label>
      <textarea id="nb-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} disabled={busy} placeholder="Änderungsauftrag, z. B. «Entferne alle Schrift im Bild. Behalte die übrige Szene unverändert bei.»" />
      <div className="form-acts">
        <button className="btn" disabled={busy || exhausted || !text.trim()}>{busy ? "Wird nachgebessert …" : "Nachbessern"}</button>
        {busy && <span className="small-note">Dauer 20 bis 90 Sekunden. Fenster offen lassen.</span>}
        {exhausted && <span className="small-note err-text">Monatskontingent aufgebraucht.</span>}
      </div>
      {error && <div className="msg err">{error}</div>}
    </form>
  );
}
