import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Topbar() {
  const session = await auth();
  const u = session?.user;
  return (
    <div className="topbar">
      <div className="wrap">
        <Link className="brand" href="/">EDUTECSOL · Lernwege</Link>
        <nav>
          <Link href="/">Beispiele</Link>
          {u && <Link href="/app">Mein Bereich</Link>}
          {u && <Link href="/app/erzeugen">Erzeugen</Link>}
          {u && <Link href="/app/seiten">Sammlung</Link>}
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
