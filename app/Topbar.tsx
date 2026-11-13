import Link from "next/link";
import { auth, signOut } from "@/auth";
import { IS_PREVIEW_DB } from "@/lib/db";

// Kopfzeile der öffentlichen Next-Seiten (Zugang, Anmelden, AGB, Datenschutz).
// Gleiche Menüpunkte wie die statischen Seiten in public/; der geschützte Bereich hat eigene Seitenleiste (AppShell).
export default async function Topbar({ active }: { active?: "zugang" }) {
  const session = await auth();
  const u = session?.user;
  const links = (
    <>
      <a href="/lernseiten-beispiele.html">Beispiele</a>
      <a href="/#werkzeuge">Werkzeuge</a>
      <a href="/#so-funktioniert-es">So funktioniert es</a>
      <Link href="/zugang" className={active === "zugang" ? "is-active" : undefined} aria-current={active === "zugang" ? "page" : undefined}>Zugang &amp; Preise</Link>
    </>
  );
  const signout = (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <button className="btn small ghost">Abmelden</button>
    </form>
  );
  return (
    <header className="lw-header">
      <div className="wrap">
        <Link className="wordmark" href="/"><span className="name">Lernwege</span><span className="by">von EDUTECSOL</span></Link>
        {IS_PREVIEW_DB && <span className="badge new" style={{ margin: 0 }}>Testplattform</span>}
        <nav className="lw-nav" aria-label="Hauptnavigation">
          {links}
          {u ? (
            <>
              <Link href="/app" className="btn small terra">Mein Bereich</Link>
              {signout}
            </>
          ) : (
            <Link href="/login" className="btn small terra">Anmelden</Link>
          )}
        </nav>
        <details className="menu">
          <summary>Menü</summary>
          <div className="panel">
            {links}
            {u ? <><Link href="/app"><b>Mein Bereich</b></Link>{signout}</> : <Link href="/login"><b>Anmelden</b></Link>}
          </div>
        </details>
      </div>
    </header>
  );
}
