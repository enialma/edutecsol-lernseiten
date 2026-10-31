import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { availableProviders, PROVIDER_LABELS } from "@/lib/ai";
import { billingOf, clearSubscription } from "@/lib/billing";
import { cancelSubscription } from "@/lib/payrexx";
import { imageQuotaFor, quotaFor } from "@/lib/quota";
import Topbar from "../Topbar";
import Footer from "../Footer";

export const dynamic = "force-dynamic";

export default async function AppHome({ searchParams }: { searchParams: Promise<{ abo?: string }> }) {
  const { abo } = await searchParams;
  const session = await auth();
  const name = session?.user?.name || session?.user?.email;
  const userId = Number(session!.user.id);
  const isAdmin = session!.user.role === "admin";
  const [billing, quota, bilder] = await Promise.all([billingOf(userId), quotaFor(userId, isAdmin), imageQuotaFor(userId, isAdmin)]);
  const providers = availableProviders();
  const fmt = (used: number, limit: number | null) => (limit === null ? `${used}` : `${used} / ${limit}`);

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
          <p className="lead">Lernseiten und Bilder direkt erzeugen, sammeln, mit Lernenden und Kollegium teilen und in Moodle bringen.</p>

          {abo === "gekuendigt" && <div className="msg ok">Dein Abo ist gekündigt. Es wird nichts mehr abgebucht.</div>}
          {abo === "fehler" && (
            <div className="msg err">
              Die Kündigung hat nicht geklappt. Bitte schreib an <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>, wir kündigen für dich.
            </div>
          )}

          <div className="dash">
            <Link className="action" href="/app/erzeugen">
              <span className="k">Lernseite</span>
              <h2>Lernseite direkt erzeugen</h2>
              <p>Material hochladen oder Thema beschreiben, Achsen wählen, fertige Lernseite mit drei Zugängen erhalten.</p>
              <span className="go">Starten →</span>
            </Link>
            <Link className="action terra" href="/app/bilder/erzeugen">
              <span className="k">Bild</span>
              <h2>Bild direkt erzeugen</h2>
              <p>Bild-Rezept ausfüllen, Bild erhalten, Schritt für Schritt nachbessern. Mit Arbeitsauftrag und Kennzeichnung.</p>
              <span className="go">Starten →</span>
            </Link>
          </div>

          <ul className="rows">
            <li>
              <h3 className="t">Meine Sammlung<small>Lernseiten</small></h3>
              <div>
                <p>Erzeugte Lernseiten öffnen, herunterladen, per Link oder QR-Code teilen, als Word oder SCORM exportieren, in Moodle legen.</p>
                <Link className="link arrow" href="/app/seiten">Sammlung öffnen</Link>
              </div>
            </li>
            <li>
              <h3 className="t">Meine Bilder<small>Bilder für Lernaufgaben</small></h3>
              <div>
                <p>Direkt erzeugte Bilder ansehen, nachbessern, herunterladen und in eine Lernseite einbinden.</p>
                <Link className="link arrow" href="/app/bilder">Bilder öffnen</Link>
              </div>
            </li>
            <li>
              <h3 className="t">Kostenlose Werkzeuge<small>Ohne Kontingent</small></h3>
              <div>
                <p>Prompt-Generator und Bildprompt-Generator bauen den Prompt für deinen eigenen KI-Chat oder dein Bildwerkzeug.</p>
                <a className="link arrow" href="/prompt-generator-v2.html">Prompt-Generator</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a className="link arrow" href="/bild-generator.html">Bildprompt-Generator</a>
              </div>
            </li>
          </ul>

          <div className="quota">
            <h2>Dein Kontingent diesen Monat</h2>
            <p className="small-note" style={{ margin: 0 }}>{isAdmin ? "Als Admin ohne Limit; gezählt wird trotzdem." : "Nicht genutzte Lernseiten verfallen am Monatsende."}</p>
            <div className="facts">
              {providers.map((p) => (
                <div key={p}>
                  <b>{fmt(quota[p].used, quota[p].limit)}</b>
                  <span>Lernseiten mit {PROVIDER_LABELS[p]}</span>
                </div>
              ))}
              <div>
                <b>{fmt(bilder.used, bilder.limit)}</b>
                <span>Bilder erzeugt oder nachgebessert</span>
              </div>
            </div>
          </div>

          {billing.subscriptionId ? (
            <div className="card" style={{ marginTop: "1.6rem" }}>
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
            <div className="card row" style={{ marginTop: "1.6rem", alignItems: "center" }}>
              <span style={{ flex: "1 1 240px" }}>Dein Zugang gilt bis {billing.validUntil} und verlängert sich nicht automatisch.</span>
              <Link className="btn small ghost" href="/zugang">Abo abschliessen</Link>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
