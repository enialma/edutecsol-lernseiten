"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Freier Auftrag der Lehrperson → /api/nachbessern (Textstream wie beim Erzeugen) → Seite neu laden. */
/** extra: weitere Knöpfe rechts neben «Nachbessern» (z. B. Fassungen); stehen ausserhalb des Formulars, damit dort eigene Formulare möglich sind. */
export default function NachbessernForm({ pageId, maxLen, extra }: { pageId: number; maxLen: number; extra?: React.ReactNode }) {
  const router = useRouter();
  const [auftrag, setAuftrag] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fertig, setFertig] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !auftrag.trim()) return;
    setBusy(true);
    setError(null);
    setFertig(null);
    setLog([]);
    try {
      const res = await fetch("/api/nachbessern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pageId, auftrag }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let done: { aenderungen: number; notiz: string | null } | null = null;
      for (;;) {
        const r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("@@DONE ")) done = JSON.parse(line.slice(7));
          else if (line.startsWith("@@ERROR ")) throw new Error(line.slice(8));
          else if (line.trim()) setLog((l) => [...l, line]);
        }
      }
      if (!done) throw new Error("Die Verbindung wurde unterbrochen, bevor die Nachbesserung fertig war. Die Seite ist unverändert.");
      setFertig(done.notiz ?? `${done.aenderungen} ${done.aenderungen === 1 ? "Änderung" : "Änderungen"} eingesetzt.`);
      setAuftrag("");
      setLog([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form id="nb-form" onSubmit={submit}>
        <label htmlFor="auftrag" className="sr">Was soll an der Seite geändert werden?</label>
        <textarea id="auftrag" rows={4} maxLength={maxLen} value={auftrag} onChange={(e) => setAuftrag(e.target.value)} disabled={busy} required
          placeholder="z. B. Aufgabe 2 mit kleineren Zahlen, und im Zugang A einen zusätzlichen Hinweis zur Formel" />
      </form>
      <div className="between nb-acts">
        <div className="nb-knoepfe">
          <button className="btn" form="nb-form" disabled={busy || !auftrag.trim()}>{busy ? "Wird nachgebessert …" : "Nachbessern"}</button>
          {extra}
        </div>
        <span className="small-note">{auftrag.length.toLocaleString("de-CH")} / {maxLen.toLocaleString("de-CH")}</span>
      </div>
      {log.length > 0 && <pre className="log" aria-live="polite">{log.join("\n")}</pre>}
      {error && <div className="msg err" role="alert">{error}</div>}
      {fertig && <div className="msg ok" role="status">Nachgebessert: {fertig}</div>}
    </div>
  );
}
