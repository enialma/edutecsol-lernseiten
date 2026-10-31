import Link from "next/link";
import { auth, signOut } from "@/auth";
import { IS_PREVIEW_DB } from "@/lib/db";

export default async function Topbar() {
  const session = await auth();
  const u = session?.user;
  const links = (
    <>
      <Link href="/">Startseite</Link>
      {!u && <Link href="/zugang">Zugang &amp; Preise</Link>}
      {u && <Link href="/app">Mein Bereich</Link>}
      {u && <Link href="/app/erzeugen">Erzeugen</Link>}
      {u && <Link href="/app/seiten">Sammlung</Link>}
      {u && <Link href="/app/bilder">Bilder</Link>}
      {u?.role === "admin" && <Link href="/admin/benutzer">Benutzer</Link>}
      {!u && <Link href="/datenschutz">Datenschutz</Link>}
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
              <span className="who">{u.name || u.email}</span>
              {signout}
            </>
          ) : (
            <Link href="/login" className="btn small terra">Anmelden</Link>
          )}
        </nav>
        <details className="menu">
          <summary>Menü</summary>
          <div className="panel">
            {u && <span className="who">{u.name || u.email}</span>}
            {links}
            {u ? signout : <Link href="/login"><b>Anmelden</b></Link>}
          </div>
        </details>
      </div>
    </header>
  );
}
