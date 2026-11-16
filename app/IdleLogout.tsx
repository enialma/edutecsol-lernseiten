"use client";
import { useEffect, useRef, useState } from "react";
import { IDLE_MS, WARN_MS } from "@/lib/idle";

// Meldet nach einer Zeit ohne Aktivität ab (geteilte Geräte im Schulzimmer).
// Die letzte Aktivität steht in localStorage, damit sich mehrere offene Tabs gegenseitig wach halten.

const KEY = "lw-last-activity";
const EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;

function readLast(fallback: number): number {
  try { return Number(localStorage.getItem(KEY)) || fallback; } catch { return fallback; }
}

export default function IdleLogout({ logout }: { logout: () => Promise<void> }) {
  const [left, setLeft] = useState<number | null>(null);
  const last = useRef(Date.now());
  const done = useRef(false);
  const pinged = useRef(0);

  function stamp() {
    last.current = Date.now();
    try { localStorage.setItem(KEY, String(last.current)); } catch {}
    // Der Server prüft die Inaktivität selbst (jwt-Callback in auth.config.ts). Wer nur tippt oder liest,
    // schickt keine Anfrage – darum die Sitzung bei Aktivität regelmässig auffrischen.
    if (last.current - pinged.current >= Math.min(60_000, IDLE_MS / 4)) {
      pinged.current = last.current;
      fetch("/api/auth/session", { cache: "no-store" }).catch(() => {});
    }
  }

  // Gleicht mit den anderen Tabs ab und meldet ab, sobald die Zeit um ist.
  function expired(): boolean {
    last.current = Math.max(last.current, readLast(last.current));
    const rest = last.current + IDLE_MS - Date.now();
    if (rest > 0) {
      setLeft(rest <= WARN_MS ? rest : null);
      return false;
    }
    setLeft(0);
    if (!done.current) {
      done.current = true;
      logout();
    }
    return true;
  }

  function touch() {
    // Schreiben drosseln: mousemove feuert sehr oft.
    if (Date.now() - last.current < 5000) return;
    // Im Hintergrund oder nach dem Ruhezustand läuft der Timer verspätet: Die erste Bewegung danach
    // darf eine abgelaufene Zeit nicht zurücksetzen.
    if (expired()) return;
    stamp();
  }

  useEffect(() => {
    stamp();
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const tick = setInterval(expired, 1000);

    return () => {
      clearInterval(tick);
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
    };
  }, []);

  if (left === null) return null;
  const sek = Math.max(0, Math.ceil(left / 1000));
  return (
    <div className="idle-warn" role="alertdialog" aria-live="assertive" aria-labelledby="idle-warn-t">
      <p id="idle-warn-t">Du wirst wegen Inaktivität in {Math.floor(sek / 60)}:{String(sek % 60).padStart(2, "0")} abgemeldet.</p>
      <button type="button" className="btn small terra" onClick={() => { if (!expired()) { stamp(); setLeft(null); } }}>Angemeldet bleiben</button>
    </div>
  );
}
