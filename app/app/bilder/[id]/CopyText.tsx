"use client";
import { useState } from "react";

export default function CopyText({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setDone(true); setTimeout(() => setDone(false), 1600);
  }
  return <button type="button" className="btn small ghost" onClick={copy}>{done ? "Kopiert ✓" : label}</button>;
}
