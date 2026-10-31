// Klassenseite: Übersicht aller freigegebenen Lernseiten einer Gruppe, für Lernende ohne Login.
import { getGruppeByToken, publicPagesOfGruppe } from "@/lib/gruppen";
import { TYP_LABELS, type Typ } from "@/lib/prompt";

export const dynamic = "force-dynamic";
export const metadata = { title: "Klassenseite – Lernwege", robots: { index: false, follow: false } };

export default async function KlassenSeite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gruppe = await getGruppeByToken(token);
  const seiten = gruppe ? await publicPagesOfGruppe(gruppe.id) : [];

  return (
    <>
      <header className="lw-header">
        <div className="wrap">
          <span className="wordmark"><span className="name">Lernwege</span><span className="by">von EDUTECSOL</span></span>
          <span className="small-note">Klassenseite</span>
        </div>
      </header>
      <main style={{ minHeight: "calc(100vh - 64px - 80px)" }}>
        <div className="wrap">
          {!gruppe ? (
            <div className="card" style={{ maxWidth: 520 }}>
              <h1 style={{ fontSize: "1.5rem" }}>Diese Klassenseite ist nicht mehr freigegeben.</h1>
              <p className="muted" style={{ margin: 0 }}>Bitte bei der Lehrperson nachfragen.</p>
            </div>
          ) : (
            <>
              <p className="kicker">Deine Lernseiten</p>
              <h1>{gruppe.name}</h1>
              {gruppe.beschreibung && <p className="lead">{gruppe.beschreibung}</p>}
              {seiten.length === 0 ? (
                <div className="card">Hier liegt noch keine Lernseite. Schau später wieder vorbei.</div>
              ) : (
                <div className="grid" style={{ marginTop: "1.4rem" }}>
                  {seiten.map((s) => (
                    <a className="tile" href={`/s/${s.share_token}`} key={s.id}>
                      <span className="row" style={{ gap: ".3rem" }}>
                        <span className="badge" style={{ background: "var(--cream)", color: "var(--terra)" }}>{TYP_LABELS[s.typ as Typ] ?? "Lernseite"}</span>
                        {s.fach && <span className="badge">{s.fach}{s.stufe ? ` · ${s.stufe}` : ""}</span>}
                      </span>
                      <h3>{s.title}</h3>
                      <p>seit {s.added_at}</p>
                      <span className="foot">Öffnen →</span>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <footer className="lw-footer" style={{ padding: "1.4rem 0" }}>
        <div className="wrap">
          <div className="bottom" style={{ border: 0, margin: 0, padding: 0 }}>
            <span>© EDUTECSOL GmbH · Lernwege</span>
            <span><a href="/datenschutz">Datenschutz</a></span>
          </div>
        </div>
      </footer>
    </>
  );
}
