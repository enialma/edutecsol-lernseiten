import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { billingOf, clearSubscription } from "@/lib/billing";
import { cancelSubscription } from "@/lib/payrexx";
import Topbar from "../Topbar";

export default async function AppHome({ searchParams }: { searchParams: Promise<{ abo?: string }> }) {
  const { abo } = await searchParams;
  const session = await auth();
  const name = session?.user?.name || session?.user?.email;
  const billing = await billingOf(Number(session!.user.id));

  const cancel = async () => {
    "use server";
    const s = await auth();
    const b = await billingOf(Number(s!.user.id));
    if (!b.subscriptionId) return;
    let result = "gekuendigt";
    try {
      await cancelSubscription(b.subscriptionId);
      await clearSubscription(b.subscriptionId);
    } catch (e) {
      console.error("Abo kündigen fehlgeschlagen", e);
      result = "fehler";
    }
    redirect(`/app?abo=${result}`);
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
            <Link className="tile" href="/bild-generator.html">
              <span className="badge new">neu</span>
              <h3>Bildprompt-Generator</h3>
              <p>Bilder für Lernaufgaben beschreiben: mit Arbeitsauftrag, Stolperstein-Check und Vier-Satz-Planung.</p>
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
          {abo === "gekuendigt" && <div className="msg ok" style={{ marginTop: "1rem" }}>Dein Abo ist gekündigt. Es wird nichts mehr abgebucht.</div>}
          {abo === "fehler" && (
            <div className="msg err" style={{ marginTop: "1rem" }}>
              Die Kündigung hat nicht geklappt. Bitte schreib an <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>, wir kündigen für dich.
            </div>
          )}
          {billing.subscriptionId ? (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p style={{ marginTop: 0 }}>Dein Abo läuft und verlängert sich automatisch{billing.validUntil ? ` (bezahlt bis ${billing.validUntil})` : ""}.</p>
              <details>
                <summary>Abo kündigen</summary>
                <form action={cancel}>
                  <p className="small-note">Es wird nicht mehr abgebucht. Dein Zugang bleibt bis zum Ende der bezahlten Laufzeit bestehen.</p>
                  <button className="btn small ghost">Jetzt kündigen</button>
                </form>
              </details>
            </div>
          ) : billing.validUntil ? (
            <div className="card row" style={{ marginTop: "1rem", alignItems: "center" }}>
              <span style={{ flex: "1 1 240px" }}>Dein Zugang gilt bis {billing.validUntil} und verlängert sich nicht automatisch.</span>
              <Link className="btn small ghost" href="/zugang">Abo abschliessen</Link>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
