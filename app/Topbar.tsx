import Link from "next/link";
import { auth, signOut } from "@/auth";
import { IS_PREVIEW_DB } from "@/lib/db";

export default async function Topbar() {
  const session = await auth();
  const u = session?.user;
  return (
    <div className="topbar">
      <div className="wrap">
        <Link className="brand" href="/">EDUTECSOL · Lernwege</Link>
        {IS_PREVIEW_DB && <span className="who" style={{ background: "var(--ochre, #F1A51A)", color: "#1E3246", borderRadius: 6, padding: ".1rem .5rem", fontWeight: 600 }}>Testplattform</span>}
        <nav>
          <Link href="/">Startseite</Link>
          {!u && <Link href="/zugang">Zugang &amp; Preise</Link>}
          <Link href="/datenschutz">Datenschutz</Link>
          {u && <Link href="/app">Mein Bereich</Link>}
          {u && <Link href="/app/erzeugen">Erzeugen</Link>}
          {u && <Link href="/app/seiten">Sammlung</Link>}
          {u && <Link href="/app/bilder">Bilder</Link>}
          {u?.role === "admin" && <Link href="/admin/benutzer">Benutzer</Link>}
          {u ? (
            <>
              <span className="who">{u.name || u.email}</span>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button className="btn small ghost" style={{ color: "#fff" }}>Abmelden</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn small terra">Anmelden</Link>
          )}
        </nav>
      </div>
    </div>
  );
}
