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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "1rem 1rem .5rem" }}>
        {kontext.reiter && <p className="small-note" style={{ margin: "0 0 .8rem" }}>Du arbeitest an: <b>{kontext.reiter}</b>{kontext.aufgabe ? ` · ${kontext.aufgabe.slice(0, 90)}${kontext.aufgabe.length > 90 ? "…" : ""}` : ""}</p>}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", margin: "0 0 .6rem" }}>
            <div style={{
              maxWidth: "88%", padding: ".6rem .85rem", borderRadius: 12, lineHeight: 1.45, fontSize: ".95rem",
              background: m.role === "user" ? "var(--navy)" : "#fff", color: m.role === "user" ? "#fff" : "var(--ink)",
              border: m.role === "user" ? "1px solid var(--navy)" : "1px solid var(--line-strong)",
              borderBottomRightRadius: m.role === "user" ? 4 : 12, borderBottomLeftRadius: m.role === "user" ? 12 : 4,
            }}>{m.content}</div>
          </div>
        ))}
        {busy && <p className="small-note" style={{ margin: ".2rem 0 0" }}>{name.toLowerCase() === "coach" ? "Der Coach" : name} überlegt …</p>}
        {error && <div className="msg err" style={{ marginTop: ".4rem" }}>{error}</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ borderTop: "1px solid var(--line)", padding: ".6rem .8rem .7rem", background: "#fff" }}>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-end" }}>
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={2} maxLength={600} disabled={busy}
            placeholder="Was hast du bis jetzt versucht?" style={{ flex: 1, minHeight: 0, resize: "none", fontSize: ".95rem" }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} aria-label="Deine Nachricht an den Coach" />
          <button className="btn terra" disabled={busy || !input.trim()} aria-label="Senden">→</button>
        </div>
        <p className="small-note" style={{ margin: ".4rem 0 0", fontSize: ".72rem" }}>Nichts wird gespeichert. Keine Namen oder persönlichen Angaben eingeben. Seite: {title}</p>
      </form>
    </div>
  );
}
