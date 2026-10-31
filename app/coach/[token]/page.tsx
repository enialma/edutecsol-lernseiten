// Chat-Oberfläche des KI-Lerncoachs, als iframe in der Lernseite (Freigabelink) geöffnet. Kein Login.
import { getPageByToken } from "@/lib/pages";
import { coachAllowedFor, COACH_DER_GROSS, COACH_NAME, IS_GENERIC } from "@/lib/coach";
import CoachChat from "./CoachChat";

export const dynamic = "force-dynamic";
export const metadata = { title: IS_GENERIC ? "Lerncoach – Lernwege" : `${COACH_NAME} – Lerncoach`, robots: { index: false } };

export default async function CoachPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ reiter?: string; aufgabe?: string; eingabe?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const page = await getPageByToken(token);
  const active = !!page && page.coach && page.owner_coach && coachAllowedFor(page);
  return (
    <main style={{ padding: 0, minHeight: "100vh", background: "var(--paper)" }}>
      {active ? (
        <CoachChat token={token} name={COACH_NAME} title={page!.title} initial={{ reiter: sp.reiter ?? "", aufgabe: sp.aufgabe ?? "", eingabe: sp.eingabe ?? "" }} />
      ) : (
        <div style={{ padding: "1.5rem", maxWidth: 420 }}>
          <p className="kicker">Lerncoach</p>
          <h1 style={{ fontSize: "1.4rem" }}>{COACH_DER_GROSS} ist hier nicht eingeschaltet.</h1>
          <p className="muted">Die Lehrperson kann den Coach auf der Detailseite der Lernseite aktivieren.</p>
        </div>
      )}
    </main>
  );
}
