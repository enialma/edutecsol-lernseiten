import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { billingOf, clearSubscription } from "@/lib/billing";
import { listGruppen } from "@/lib/gruppen";
import { listPages } from "@/lib/pages";
import { cancelSubscription } from "@/lib/payrexx";
import AppShell from "../AppShell";

export const dynamic = "force-dynamic";

// Die fünf Seitentypen, wie sie «Neue Seite erzeugen» kennt (Parameter ?typ=…)
const TYPEN: { typ: string; name: string; text: string }[] = [
  { typ: "lernseite", name: "Lernseite", text: "Eine Kernaufgabe, mehrere Zugänge" },
  { typ: "arbeitsblatt", name: "Arbeitsblatt", text: "Dieselben Zugänge, für Papier" },
  { typ: "pruefung", name: "Prüfungsvorbereitung", text: "Lernziele, Übungsprüfung, Lücken" },
  { typ: "spiel", name: "Lernspiel", text: "Vier Levels, Punkte und Serie" },
  { typ: "hilfe", name: "Lernhilfe", text: "Merkblatt, Lernkarten, Glossar" },
];
const TYP_NAME: Record<string, string> = Object.fromEntries(TYPEN.map((t) => [t.typ, t.name]));

export default async function AppHome({ searchParams }: { searchParams: Promise<{ abo?: string }> }) {
  const { abo } = await searchParams;
  const session = await auth();
  const userId = Number(session!.user.id);
  const [billing, pages, gruppen] = await Promise.all([billingOf(userId), listPages(userId, "mine"), listGruppen(userId)]);
  const zuletzt = pages.slice(0, 5);

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
    <AppShell active="start">
      <header className="page-head">
        <div>
          <h1>Mein Bereich</h1>
          <p>Material geben, wählen, was entsteht, einsetzen.</p>
        </div>
        <Link className="btn terra cta" href="/app/erzeugen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Neue Seite erzeugen
        </Link>
      </header>

      {abo === "gekuendigt" && <div className="msg ok">Dein Abo ist gekündigt. Es wird nichts mehr abgebucht.</div>}
      {abo === "fehler" && (
        <div className="msg err">
          Die Kündigung hat nicht geklappt. Bitte schreib an <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>, wir kündigen für dich.
        </div>
      )}

      <section aria-labelledby="h-typ">
        <h2 id="h-typ" className="sec-title">Was soll entstehen?</h2>
        <div className="types">
          {TYPEN.map((t) => (
            <Link key={t.typ} className="type" href={`/app/erzeugen?typ=${t.typ}`}>
              <b>{t.name}</b>
              <span>{t.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="cols">
        <section className="box wide" aria-labelledby="h-zul">
          <div className="box-head">
            <h2 id="h-zul">Zuletzt erzeugt</h2>
            <Link className="more" href="/app/seiten">Ganze Sammlung</Link>
          </div>
          {zuletzt.length === 0 ? (
            <p className="box-empty">Noch keine Seite. <Link className="more" href="/app/erzeugen">Erzeuge deine erste.</Link></p>
          ) : (
            zuletzt.map((p) => {
              const typ = TYP_NAME[(p.params as { typ?: string })?.typ ?? "lernseite"] ?? "Lernseite";
              const meta = [typ, p.fach, p.stufe, p.coach ? "Coach an" : null].filter(Boolean).join(" · ");
              const status = p.share_token ? ["frei", "Freigegeben"] : p.pool ? ["pool", "Im Pool"] : p.school ? ["pool", "Meine Schule"] : ["priv", "Privat"];
              return (
                <Link key={p.id} className="lrow" href={`/app/seiten/${p.id}`}>
                  <span className="lrow-main"><b>{p.title}</b><small>{meta}</small></span>
                  <span className={`tag ${status[0]}`}>{status[1]}</span>
                  <span className="lrow-when">{p.created_at.slice(0, 10)}</span>
                </Link>
              );
            })
          )}
        </section>

        <div className="narrow">
          <section className="box pad" aria-labelledby="h-kl">
            <h2 id="h-kl">Klassenlinks</h2>
            {gruppen.length === 0 ? (
              <p className="box-text">Mit einer Klasse oder Gruppe gibst du alle freigegebenen Seiten über einen einzigen Link weiter.</p>
            ) : (
              <ul className="klist">
                {gruppen.slice(0, 5).map((g) => (
                  <li key={g.id}>
                    <Link href={`/app/gruppen/${g.id}`}>{g.name}</Link>
                    <span>{g.seiten === 1 ? "1 Seite" : `${g.seiten} Seiten`}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link className="more" href="/app/gruppen">{gruppen.length === 0 ? "Klassenlink anlegen" : "Klassen und Gruppen verwalten"}</Link>
          </section>

          <section className="box pad soft" aria-labelledby="h-wz">
            <h2 id="h-wz">Bilder und Werkzeuge</h2>
            <p className="box-text">Bilder für Lernaufgaben direkt erzeugen und nachbessern. Die Prompt-Generatoren brauchen kein Kontingent.</p>
            <ul className="klist links">
              <li><Link href="/app/bilder/erzeugen">Bild erzeugen</Link></li>
              <li><Link href="/app/bilder">Meine Bilder</Link></li>
              <li><a href="/prompt-generator-v2.html">Prompt-Generator</a></li>
              <li><a href="/bild-generator.html">Bildprompt-Generator</a></li>
            </ul>
          </section>
        </div>
      </div>

      {billing.subscriptionId ? (
        <section className="box pad abo" aria-labelledby="h-abo">
          <h2 id="h-abo">Dein Abo</h2>
          <p className="box-text">Dein Abo läuft und verlängert sich automatisch{billing.validUntil ? ` (bezahlt bis ${billing.validUntil})` : ""}.</p>
          <p className="small-note">Zusatzoption Lerncoach für Lernende: im Abo «mit Lerncoach» enthalten. Wechsel vom laufenden Abo per Mail an <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>, wir schalten frei und passen die Abrechnung an.</p>
          <details>
            <summary>Abo kündigen</summary>
            <form action={cancel}>
              <p className="small-note">Es wird nicht mehr abgebucht. Dein Zugang bleibt bis zum Ende der bezahlten Laufzeit bestehen.</p>
              <button className="btn small ghost">Jetzt kündigen</button>
            </form>
          </details>
        </section>
      ) : billing.validUntil ? (
        <section className="box pad abo row-between" aria-label="Dein Zugang">
          <span>Dein Zugang gilt bis {billing.validUntil} und verlängert sich nicht automatisch.</span>
          <Link className="btn ghost" href="/zugang">Abo abschliessen</Link>
        </section>
      ) : null}
    </AppShell>
  );
}
