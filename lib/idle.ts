// Zeiten für die automatische Abmeldung bei Inaktivität (app/IdleLogout.tsx, Hinweis auf der Login-Seite).
export const IDLE_MS = 5 * 60 * 1000;
export const WARN_MS = 1 * 60 * 1000;

// «30 Minuten», «1 Stunde», «45 Sekunden» …
export function idleLabel(ms: number = IDLE_MS): string {
  const s = Math.round(ms / 1000);
  if (s % 3600 === 0) return s === 3600 ? "1 Stunde" : `${s / 3600} Stunden`;
  if (s % 60 === 0) return s === 60 ? "1 Minute" : `${s / 60} Minuten`;
  return s === 1 ? "1 Sekunde" : `${s} Sekunden`;
}
