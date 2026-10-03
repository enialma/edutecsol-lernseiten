import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { billingOf } from "@/lib/billing";
import { createPortal } from "@/lib/stripe";
import Topbar from "../Topbar";

export default async function AppHome() {
  const session = await auth();
  const name = session?.user?.name || session?.user?.email;
  const billing = await billingOf(Number(session!.user.id));

  const portal = async () => {
    "use server";
    const s = await auth();
    const b = await billingOf(Number(s!.user.id));
    if (!b.customerId) return;
    const h = await headers();
    redirect(await createPortal(b.customerId, `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`));
  };
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>Willkommen, {name}</h1>
          <p className="lead">
            Hier entstehen die Werkzeuge, die über den Prompt-Generator hinausgehen: Lernseiten direkt erzeugen,
            sammeln und in Moodle bringen.
          </p>
          <div className="grid">
            <Link className="tile" href="/prompt-generator-v2.html">
              <span className="badge">verfügbar</span>
              <h3>Prompt-Generator</h3>
              <p>Prompt zusammenstellen und mit eigenem Material an Claude schicken.</p>
              <span className="foot">Öffnen →</span>
            </Link>
            <Link className="tile" href="/app/erzeugen" style={{ background: "var(--navy)", color: "#fff", borderColor: "var(--navy)" }}>
              <span className="badge new">neu</span>
              <h3>Lernseite direkt erzeugen</h3>
              <p style={{ color: "#c3ccd6" }}>Material hochladen, Achsen wählen, fertige HTML-Lernseite erhalten – ohne Medienbruch.</p>
              <span className="foot" style={{ color: "var(--ochre)" }}>Starten →</span>
            </Link>
            <Link className="tile" href="/app/seiten">
              <span className="badge">verfügbar</span>
              <h3>Meine Sammlung</h3>
              <p>Erzeugte Lernseiten öffnen, herunterladen, in Moodle laden.</p>
              <span className="foot">Öffnen →</span>
            </Link>
          </div>
          {billing.customerId && (
            <form action={portal} className="card row" style={{ marginTop: "1rem", alignItems: "center" }}>
              <span style={{ flex: "1 1 240px" }}>
                {billing.hasSubscription ? "Dein Abo läuft und verlängert sich automatisch." : `Dein Abo ist beendet. Der Zugang gilt noch bis ${billing.validUntil ?? "zum Ablauf"}.`}
              </span>
              <button className="btn small ghost">Abo verwalten</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
