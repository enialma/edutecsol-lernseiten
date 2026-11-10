"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type Kontext = { reiter: string; aufgabe: string; eingabe: string };

export default function CoachChat({ token, name, title, initial }: { token: string; name: string; title: string; initial: Kontext }) {
  const [kontext, setKontext] = useState<Kontext>(initial);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: `${name.toLowerCase() === "coach" ? "Hallo, ich bin dein Coach." : `Hallo, ich bin ${name}.`} Ich verrate keine Lösungen, aber ich helfe dir, selbst draufzukommen. Woran arbeitest du gerade, und wo hängst du?` }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Kontext-Updates aus der Lernseite (Reiterwechsel, Eingaben)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.type === "lw-kontext" && d.kontext) setKontext({ reiter: String(d.kontext.reiter ?? ""), aufgabe: String(d.kontext.aufgabe ?? ""), eingabe: String(d.kontext.eingabe ?? "") });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, messages: next.slice(1), kontext }),
      });
      const j = await res.json();
      if (!res.ok || !j.reply) throw new Error(j.error || "Keine Antwort erhalten.");
      setMsgs((m) => [...m, { role: "assistant", content: j.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const generic = name.toLowerCase() === "coach";
  return (
    <div className="cc">
      <div ref={logRef} className="cc-log" aria-live="polite">
        {kontext.reiter && <p className="cc-ctx">Du arbeitest an: <b>{kontext.reiter}</b>{kontext.aufgabe ? ` · ${kontext.aufgabe.slice(0, 90)}${kontext.aufgabe.length > 90 ? "…" : ""}` : ""}</p>}
        {msgs.map((m, i) => (
          <p key={i} className={`cc-msg ${m.role === "user" ? "user" : "bot"}`}>
            <span className="sr">{m.role === "user" ? "Du: " : "Coach: "}</span>{m.content}
          </p>
        ))}
        {busy && <p className="cc-ctx">{generic ? "Der Coach" : name} überlegt …</p>}
        {error && <div className="msg err" role="alert">{error}</div>}
      </div>
      <form className="cc-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <div className="cc-row">
          <label htmlFor="cc-input" className="sr">Nachricht an den Coach</label>
          <textarea id="cc-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={600} disabled={busy}
            placeholder="Frage stellen"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn terra" disabled={busy || !input.trim()}>Senden</button>
        </div>
        <p className="cc-note">Nichts wird gespeichert. Keine Namen oder persönlichen Angaben eingeben. Seite: {title}</p>
      </form>
    </div>
  );
}
