import Link from "next/link";
import { auth } from "@/auth";
import { listGruppen } from "@/lib/gruppen";
import AppShell from "../../AppShell";
import { createGruppeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GruppenPage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const gruppen = await listGruppen(userId);

  return (
    <AppShell active="klassen">
      <nav className="crumb" aria-label="Brotkrumen"><Link href="/app/seiten">Sammlung</Link> <span aria-hidden="true">/</span> Klassen und Gruppen</nav>
      <header className="page-head">
        <div>
          <h1>Klassen und Gruppen</h1>
          <p>
            Ordne deine Lernseiten nach Klassen, Kursen oder Themen. Eine Seite kann in mehreren Gruppen liegen.
            Jede Gruppe kann einen Klassenlink bekommen: eine Übersicht aller freigegebenen Seiten, die Lernende ohne Login öffnen.
          </p>
        </div>
      </header>

      <div className="cols top">
        <section className="box wide" aria-labelledby="h-gl">
          <div className="box-head">
            <h2 id="h-gl">Deine Gruppen</h2>
            <span className="soft-count">{gruppen.length === 1 ? "1 Gruppe" : `${gruppen.length} Gruppen`}</span>
          </div>
          {gruppen.length === 0 ? (
            <p className="box-empty">
              Noch keine Gruppe. Leg rechts die erste an, zum Beispiel eine Klasse. Danach kannst du auf jeder Lernseite ankreuzen, zu welchen Gruppen sie gehört.
            </p>
          ) : (
            <div className="ltable-wrap">
              <table className="ltable compact">
                <thead>
                  <tr><th scope="col">Gruppe</th><th scope="col">Seiten</th><th scope="col">Freigegeben</th><th scope="col">Klassenlink</th><th scope="col" className="r">Aktion</th></tr>
                </thead>
                <tbody>
                  {gruppen.map((g) => (
                    <tr key={g.id}>
                      <th scope="row">
                        <Link className="ltitle" href={`/app/gruppen/${g.id}`}><b>{g.name}</b><small>{g.beschreibung || `angelegt am ${g.created_at}`}</small></Link>
                      </th>
                      <td>{g.seiten}</td>
                      <td className="soft">{g.seiten > 0 ? `${g.freigegeben} von ${g.seiten}` : "–"}</td>
                      <td>{g.share_token ? <span className="tag frei">Aktiv</span> : <span className="tag priv">Kein Link</span>}</td>
                      <td className="r"><Link className="btn small ghost" href={`/app/gruppen/${g.id}`} aria-label={`${g.name} öffnen`}>Öffnen</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="narrow">
          <form action={createGruppeAction} className="box pad block newg" aria-labelledby="h-ng">
            <h2 id="h-ng">Neue Gruppe</h2>
            <div>
              <label htmlFor="g-name">Name</label>
              <input id="g-name" name="name" required maxLength={80} placeholder="z. B. BM2 Wirtschaft 2026" />
            </div>
            <div>
              <label htmlFor="g-besch">Beschreibung (optional)</label>
              <input id="g-besch" name="beschreibung" maxLength={300} placeholder="z. B. Mathematik, Dienstag 2. Lektion" />
            </div>
            <button className="btn terra">Gruppe anlegen</button>
            <p className="box-text soft">Danach öffnet sich die Gruppe, und du kannst Seiten hinzufügen und den Klassenlink erstellen.</p>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
