import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prepareSignup } from "@/lib/billing";
import { LIMITS } from "@/lib/quota";
import { createCheckout, payrexxReady } from "@/lib/payrexx";
import Topbar from "../Topbar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zugang – EDUTECSOL Lernwege" };

async function buy(fd: FormData) {
  "use server";
  const email = String(fd.get("email") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const plan = fd.get("plan") === "month" ? "month" : "year";
  const fail = (m: string) => redirect(`/zugang?fehler=${encodeURIComponent(m)}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Bitte eine gültige E-Mail-Adresse angeben.");
  if (password && password.length < 8) fail("Das Passwort braucht mindestens 8 Zeichen.");
  if (fd.get("agb") !== "1") fail("Bitte die AGB bestätigen.");
  let url: string;
  try {
    const { userId } = await prepareSignup(email, name, password);
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    url = await createCheckout({ userId, email, plan, origin });
  } catch (e) {
    console.error("Zugang kaufen fehlgeschlagen", e);
    return fail(e instanceof Error && !e.message.startsWith("Payrexx") ? e.message : "Die Bezahlseite konnte nicht geöffnet werden. Bitte später erneut versuchen.");
  }
  redirect(url);
}

export default async function ZugangPage({ searchParams }: { searchParams: Promise<{ status?: string; fehler?: string }> }) {
  const { status, fehler } = await searchParams;
  const ready = payrexxReady();

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Geschützter Bereich</p>
          <h1>Zugang für Lehrpersonen</h1>
          <p className="lead">
            Lernseiten direkt mit KI erzeugen, sammeln, mit Lernenden und Kolleginnen teilen, als Word-Arbeitsblatt oder
            für Moodle exportieren. Kostet so viel wie ein Kaffee im Monat.
          </p>

          {status === "danke" && (
            <div className="msg ok">
              Vielen Dank, die Zahlung ist eingegangen. Dein Zugang wird in wenigen Sekunden freigeschaltet.{" "}
              <Link href="/login">Jetzt anmelden</Link>
            </div>
          )}
          {status === "abgebrochen" && <div className="msg err">Die Zahlung wurde abgebrochen. Es wurde nichts belastet.</div>}
          {fehler && <div className="msg err">{fehler}</div>}

          <div className="grid">
            <div className="card">
              <p className="kicker">Einzelperson</p>
              <h2 style={{ marginTop: 0 }}>CHF 8 pro Monat oder CHF 60 pro Jahr</h2>
              <p className="small-note" style={{ marginTop: "-.4rem" }}>Preise inklusive Mehrwertsteuer.</p>
              <ul>
                <li>Pro Monat {LIMITS.claude} Lernseiten mit Claude und {LIMITS.infomaniak} mit Infomaniak (Schweiz)</li>
                <li>Eigene Sammlung, Freigabelink mit QR-Code, gemeinsamer Pool</li>
                <li>Word-Arbeitsblatt, SCORM-Paket und Moodle-Anbindung</li>
                <li>Verlängert sich automatisch, jederzeit auf das Ende der Laufzeit kündbar</li>
              </ul>
              {ready ? (
                <form action={buy}>
                  <label>Laufzeit</label>
                  <select name="plan" defaultValue="year">
                    <option value="year">Jahresabo – CHF 60 pro Jahr</option>
                    <option value="month">Monatsabo – CHF 8 pro Monat</option>
                  </select>
                  <label>E-Mail *</label>
                  <input name="email" type="email" required autoComplete="email" />
                  <label>Name</label>
                  <input name="name" autoComplete="name" />
                  <label>Passwort (mindestens 8 Zeichen)</label>
                  <input name="password" type="password" minLength={8} autoComplete="new-password" />
                  <p className="small-note">
                    Mit einem Microsoft-365-Schulkonto unter derselben E-Mail-Adresse kannst du dich auch ohne Passwort
                    anmelden. Besteht das Konto bereits, wird es nur verlängert; Name und Passwort bleiben unverändert.
                  </p>
                  <label style={{ display: "flex", gap: ".5rem", alignItems: "flex-start", fontWeight: 400 }}>
                    <input type="checkbox" name="agb" value="1" required style={{ width: "auto", marginTop: ".25rem" }} />
                    <span>Ich akzeptiere die <Link href="/agb">AGB</Link> und habe die <Link href="/datenschutz">Datenschutzerklärung</Link> gelesen.</span>
                  </label>
                  <div style={{ marginTop: "1rem" }}><button className="btn terra">Weiter zur Bezahlung</button></div>
                  <p className="small-note" style={{ marginTop: ".6rem" }}>Die Zahlung läuft über Payrexx (Schweiz) – mit TWINT, PostFinance oder Karte. Wir sehen und speichern keine Kartendaten.</p>
                </form>
              ) : (
                <p className="small-note">
                  Die Online-Bezahlung wird in Kürze freigeschaltet. Bis dahin: <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>
                </p>
              )}
            </div>

            <div className="card">
              <p className="kicker">Schule oder Team</p>
              <h2 style={{ marginTop: 0 }}>Auf Rechnung</h2>
              <ul>
                <li>Zugänge für alle Lehrpersonen einer Institution, eine Rechnung pro Jahr</li>
                <li>Lernseiten nur innerhalb der eigenen Schule teilen</li>
                <li>Anmeldung mit dem Microsoft-365-Schulkonto</li>
              </ul>
              <p>Schreib uns für ein Angebot: <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a></p>
              <p className="small-note">Schon freigeschaltet? <Link href="/login">Zur Anmeldung</Link></p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
