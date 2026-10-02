import Link from "next/link";
import { auth } from "@/auth";
import { listPages } from "@/lib/pages";
import Topbar from "../../Topbar";

export const dynamic = "force-dynamic";

export default async function SeitenPage({ searchParams }: { searchParams: Promise<{ alle?: string }> }) {
  const session = await auth();
  const { alle } = await searchParams;
  const isAdmin = session?.user?.role === "admin";
  const showAll = isAdmin && alle === "1";
  const pages = await listPages(Number(session!.user.id), showAll);
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>Meine Sammlung</h1>
          <p className="lead">Alle erzeugten Lernseiten. Öffnen, herunterladen, in Moodle laden.</p>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <Link className="btn terra" href="/app/erzeugen">+ Neue Lernseite</Link>
            {isAdmin && (
              <Link className="btn ghost" href={showAll ? "/app/seiten" : "/app/seiten?alle=1"}>{showAll ? "Nur meine" : "Alle Benutzer"}</Link>
            )}
          </div>
          {pages.length === 0 ? (
            <div className="card">Noch keine Lernseite. <Link href="/app/erzeugen">Jetzt die erste erzeugen.</Link></div>
          ) : (
            <div className="grid">
              {pages.map((p) => (
                <Link className="tile" href={`/app/seiten/${p.id}`} key={p.id}>
                  <span className="badge">{p.fach}{p.stufe ? ` · ${p.stufe}` : ""}</span>
                  <h3>{p.title}</h3>
                  <p>
                    {p.created_at} · {p.provider === "claude" ? "Claude" : "Infomaniak"}
                    {showAll && p.owner_email ? ` · ${p.owner_email}` : ""}
                  </p>
                  <span className="foot">Öffnen →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
