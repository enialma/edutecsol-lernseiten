import Link from "next/link";
import { auth } from "@/auth";
import { listGruppen } from "@/lib/gruppen";
import Topbar from "../../Topbar";
import Footer from "../../Footer";
import { createGruppeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GruppenPage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const gruppen = await listGruppen(userId);

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker"><Link href="/app/seiten">← Meine Sammlung</Link></p>
          <h1>Klassen und Gruppen</h1>
          <p className="lead">
            Ordne deine Lernseiten nach Klassen, Kursen oder Themen. Eine Seite kann in mehreren Gruppen liegen.
            Jede Gruppe kann einen Klassenlink bekommen: eine Übersicht aller freigegebenen Seiten, die Lernende ohne Login öffnen.
          </p>

          <form action={createGruppeAction} className="card" style={{ padding: ".9rem 1rem", marginBottom: "1.2rem" }}>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ margin: "0 0 .2rem" }}>Neue Gruppe</label>
                <input name="name" required maxLength={80} placeholder="z. B. BM2 Wirtschaft 2026" />
              </div>
              <div style={{ flex: "2 1 240px" }}>
                <label style={{ margin: "0 0 .2rem" }}>Beschreibung (optional)</label>
                <input name="beschreibung" maxLength={300} placeholder="z. B. Mathematik, Dienstag 2. Lektion" />
              </div>
              <button className="btn small">Gruppe anlegen</button>
            </div>
          </form>

          {gruppen.length === 0 ? (
            <div className="card">
              Noch keine Gruppe. Leg oben die erste an, zum Beispiel eine Klasse. Danach kannst du auf jeder Lernseite ankreuzen, zu welchen Gruppen sie gehört.
            </div>
          ) : (
            <div className="grid">
              {gruppen.map((g) => (
                <Link className="tile" href={`/app/gruppen/${g.id}`} key={g.id}>
                  <span className="row" style={{ gap: ".3rem" }}>
                    <span className="badge">{g.seiten === 1 ? "1 Seite" : `${g.seiten} Seiten`}</span>
                    {g.share_token ? <span className="badge ok">Klassenlink</span> : <span className="badge" style={{ background: "var(--paper)", color: "var(--ink-soft)" }}>kein Klassenlink</span>}
                  </span>
                  <h3>{g.name}</h3>
                  <p>{g.beschreibung || `angelegt am ${g.created_at}`}{g.seiten > 0 ? ` · ${g.freigegeben} von ${g.seiten} mit Freigabelink` : ""}</p>
                  <span className="foot">Öffnen →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
