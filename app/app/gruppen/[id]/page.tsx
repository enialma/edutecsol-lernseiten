import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getGruppe } from "@/lib/gruppen";
import { listPages } from "@/lib/pages";
import { TYP_LABELS, type Typ } from "@/lib/prompt";
import AppShell from "../../../AppShell";
import CopyButton from "../../seiten/[id]/CopyButton";
import { addPagesAction, deleteGruppeAction, gruppeShareAction, removePageAction, sharePageFromGruppeAction, updateGruppeAction } from "../actions";

export const dynamic = "force-dynamic";

const typOf = (params: Record<string, unknown>) => TYP_LABELS[((params as { typ?: Typ }).typ ?? "lernseite") as Typ] ?? "Lernseite";

export default async function GruppePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const userId = Number(session!.user.id);
  const isAdmin = session!.user.role === "admin";
  const gruppe = await getGruppe(Number(id), userId, isAdmin);
  if (!gruppe) notFound();
  // Seiten der Gruppe und alle übrigen Seiten der Besitzerin (zum Hinzufügen)
  const [inGruppe, alle] = await Promise.all([listPages(gruppe.user_id, "mine", { gruppe: gruppe.id }), listPages(gruppe.user_id, "mine")]);
  const drin = new Set(inGruppe.map((p) => p.id));
  const uebrige = alle.filter((p) => !drin.has(p.id));

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const link = gruppe.share_token ? `${origin}/g/${gruppe.share_token}` : null;
  const qr = link ? await QRCode.toDataURL(link, { margin: 1, width: 180, color: { dark: "#1E3246", light: "#ffffff" } }) : null;
  const slug = gruppe.name.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "gruppe";
  const ohneLink = inGruppe.filter((p) => !p.share_token).length;

  return (
    <AppShell active="klassen">
      <nav className="crumb" aria-label="Brotkrumen"><Link href="/app/gruppen">Klassen und Gruppen</Link> <span aria-hidden="true">/</span> {gruppe.name}</nav>
      <header className="page-head">
        <div>
          <h1>{gruppe.name}</h1>
          <p>
            {gruppe.beschreibung ? `${gruppe.beschreibung} · ` : ""}
            {inGruppe.length === 1 ? "1 Seite" : `${inGruppe.length} Seiten`}, {gruppe.freigegeben} davon mit Freigabelink
          </p>
        </div>
        {inGruppe.length > 0 && (
          <div className="head-acts">
            <Link className="btn ghost" href={`/app/seiten?gruppe=${gruppe.id}`}>In der Sammlung anzeigen</Link>
          </div>
        )}
      </header>

      <div className="detail">
        <div className="detail-main">
          <section className="box" aria-labelledby="h-gs">
            <div className="box-head">
              <h2 id="h-gs">Seiten in dieser Gruppe</h2>
              <span className="soft-count">{inGruppe.length === 1 ? "1 Seite" : `${inGruppe.length} Seiten`}</span>
            </div>
            {ohneLink > 0 && link && (
              <p className="box-note">
                {ohneLink === 1 ? "1 Seite hat" : `${ohneLink} Seiten haben`} noch keinen Freigabelink und {ohneLink === 1 ? "erscheint" : "erscheinen"} deshalb nicht auf der Klassenseite.
              </p>
            )}
            {inGruppe.length === 0 ? (
              <p className="box-empty">Noch keine Seite. Füge unten Seiten aus deiner Sammlung hinzu oder kreuze die Gruppe auf der Detailseite einer Lernseite an.</p>
            ) : (
              <div className="ltable-wrap">
                <table className="ltable compact">
                  <thead>
                    <tr><th scope="col">Lernseite</th><th scope="col">Typ</th><th scope="col">Für Lernende</th><th scope="col" className="r">Aktion</th></tr>
                  </thead>
                  <tbody>
                    {inGruppe.map((p) => {
                      const sub = [p.fach, p.stufe, p.created_at.slice(0, 10)].filter(Boolean).join(" · ");
                      return (
                        <tr key={p.id}>
                          <th scope="row">
                            <Link className="ltitle" href={`/app/seiten/${p.id}`}><b>{p.title}</b><small>{sub}</small></Link>
                          </th>
                          <td>{typOf(p.params)}</td>
                          <td>
                            {p.share_token ? (
                              <a className="tag frei tag-link" href={`/s/${p.share_token}`} target="_blank" rel="noopener">Freigegeben, ansehen</a>
                            ) : (
                              <form action={sharePageFromGruppeAction}>
                                <input type="hidden" name="id" value={gruppe.id} />
                                <input type="hidden" name="seite" value={p.id} />
                                <button className="btn small ghost">Freigabelink erstellen</button>
                              </form>
                            )}
                          </td>
                          <td className="r">
                            <form action={removePageAction}>
                              <input type="hidden" name="id" value={gruppe.id} />
                              <input type="hidden" name="seite" value={p.id} />
                              <button className="btn small ghost" title="Aus der Gruppe entfernen, die Seite bleibt in der Sammlung" aria-label={`${p.title} aus der Gruppe entfernen`}>Entfernen</button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <details className="box fold">
            <summary>Seiten aus der Sammlung hinzufügen{uebrige.length > 0 ? ` (${uebrige.length} verfügbar)` : ""}</summary>
            {uebrige.length === 0 ? (
              <p className="box-text soft">Alle deine Seiten liegen bereits in dieser Gruppe{alle.length === 0 ? ", beziehungsweise du hast noch keine Lernseite erzeugt" : ""}.</p>
            ) : (
              <form action={addPagesAction}>
                <input type="hidden" name="id" value={gruppe.id} />
                <div className="checks">
                  {uebrige.map((p) => (
                    <label key={p.id} className="check tall">
                      <input type="checkbox" name="seite" value={p.id} />
                      <span>{p.title}</span>
                      <small>{typOf(p.params)} · {p.fach}{p.stufe ? ` · ${p.stufe}` : ""} · {p.created_at}{p.share_token ? " · Freigabelink" : ""}</small>
                    </label>
                  ))}
                </div>
                <button className="btn">Ausgewählte hinzufügen</button>
              </form>
            )}
          </details>
        </div>

        <div className="detail-side">
          <section className="share" aria-labelledby="h-kl">
            <div className="between">
              <h2 id="h-kl">Klassenlink</h2>
              <span className="share-state">{link ? "Aktiv" : "Aus"}</span>
            </div>
            {link ? (
              <>
                <div className="share-row">
                  {qr && <img src={qr} alt="QR-Code zum Klassenlink" width={96} height={96} />}
                  <div>
                    <label htmlFor="klnk">Klassenlink, ohne Konto</label>
                    <input id="klnk" type="text" readOnly value={link} />
                  </div>
                </div>
                <div className="share-acts">
                  <CopyButton text={link} className="btn terra" />
                  {qr && <a className="btn on-navy" href={qr} download={`${slug}-qr.png`}>QR-Code speichern</a>}
                </div>
                <a className="share-off" href={link} target="_blank" rel="noopener">Klassenseite ansehen</a>
                <p className="share-note">
                  Eine Übersicht aller Seiten dieser Gruppe, die einen Freigabelink haben. Wer den Link hat, braucht kein Login.
                  Neue Seiten erscheinen automatisch, sobald du sie der Gruppe zuordnest und freigibst.
                </p>
                <form action={gruppeShareAction}>
                  <input type="hidden" name="id" value={gruppe.id} />
                  <input type="hidden" name="on" value="0" />
                  <button className="share-off">Klassenlink zurückziehen</button>
                </form>
              </>
            ) : (
              <>
                <p className="share-note">
                  Noch kein Klassenlink. Er zeigt den Lernenden eine Übersicht aller freigegebenen Seiten dieser Gruppe, ohne Login.
                  Ein Link für die ganze Klasse statt ein Link pro Seite.
                </p>
                <form action={gruppeShareAction} className="share-acts">
                  <input type="hidden" name="id" value={gruppe.id} />
                  <input type="hidden" name="on" value="1" />
                  <button className="btn terra">Klassenlink erstellen</button>
                </form>
              </>
            )}
          </section>

          <form action={updateGruppeAction} className="box pad block newg" aria-labelledby="h-gn">
            <h2 id="h-gn">Name und Beschreibung</h2>
            <input type="hidden" name="id" value={gruppe.id} />
            <div>
              <label htmlFor="g-name">Name</label>
              <input id="g-name" name="name" required maxLength={80} defaultValue={gruppe.name} />
            </div>
            <div>
              <label htmlFor="g-besch">Beschreibung</label>
              <input id="g-besch" name="beschreibung" maxLength={300} defaultValue={gruppe.beschreibung ?? ""} placeholder="optional" />
            </div>
            <button className="btn ghost">Speichern</button>
          </form>
        </div>
      </div>

      <form action={deleteGruppeAction} className="danger">
        <input type="hidden" name="id" value={gruppe.id} />
        <button className="btn ghost">Gruppe löschen</button>
        <span className="danger-note">Die Lernseiten bleiben in der Sammlung erhalten. Ein Klassenlink dieser Gruppe wird ungültig.</span>
      </form>
    </AppShell>
  );
}
