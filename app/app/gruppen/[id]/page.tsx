import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getGruppe } from "@/lib/gruppen";
import { listPages } from "@/lib/pages";
import { TYP_LABELS, type Typ } from "@/lib/prompt";
import Topbar from "../../../Topbar";
import Footer from "../../../Footer";
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
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker"><Link href="/app/gruppen">← Klassen und Gruppen</Link></p>
          <h1>{gruppe.name}</h1>
          <p className="lead">
            {gruppe.beschreibung ? `${gruppe.beschreibung} · ` : ""}
            {inGruppe.length === 1 ? "1 Seite" : `${inGruppe.length} Seiten`}, {gruppe.freigegeben} davon mit Freigabelink
            {inGruppe.length > 0 && <> · <Link href={`/app/seiten?gruppe=${gruppe.id}`}>in der Sammlung anzeigen</Link></>}
          </p>

          <div className="grid" style={{ marginBottom: "1rem" }}>
            <div className="card">
              <p className="kicker">Für Lernende</p>
              <h3 style={{ margin: "0 0 .4rem" }}>Klassenlink</h3>
              {link ? (
                <>
                  <p className="small-note">
                    Eine Übersicht aller Seiten dieser Gruppe, die einen Freigabelink haben. Wer den Link hat, braucht kein Login.
                    Neue Seiten erscheinen automatisch, sobald du sie der Gruppe zuordnest und freigibst.
                  </p>
                  <div className="row" style={{ alignItems: "center" }}>
                    <input readOnly value={link} style={{ flex: "1 1 220px", fontSize: ".85rem" }} />
                    <CopyButton text={link} />
                  </div>
                  <div className="row" style={{ alignItems: "center", marginTop: ".8rem" }}>
                    {qr && <img src={qr} alt="QR-Code zum Klassenlink" width={120} height={120} style={{ borderRadius: 8, border: "1px solid var(--line)" }} />}
                    <div className="row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                      <a className="btn small ghost" href={link} target="_blank" rel="noopener">Klassenseite ansehen</a>
                      {qr && <a className="btn small ghost" href={qr} download={`${slug}-qr.png`}>QR-Code speichern</a>}
                      <form action={gruppeShareAction}>
                        <input type="hidden" name="id" value={gruppe.id} />
                        <input type="hidden" name="on" value="0" />
                        <button className="btn small ghost" style={{ color: "var(--err)" }}>Klassenlink zurückziehen</button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="small-note">
                    Noch kein Klassenlink. Er zeigt den Lernenden eine Übersicht aller freigegebenen Seiten dieser Gruppe, ohne Login.
                    Ein Link für die ganze Klasse statt ein Link pro Seite.
                  </p>
                  <form action={gruppeShareAction}>
                    <input type="hidden" name="id" value={gruppe.id} />
                    <input type="hidden" name="on" value="1" />
                    <button className="btn small">Klassenlink erstellen</button>
                  </form>
                </>
              )}
            </div>

            <div className="card">
              <p className="kicker">Gruppe</p>
              <h3 style={{ margin: "0 0 .4rem" }}>Name und Beschreibung</h3>
              <form action={updateGruppeAction}>
                <input type="hidden" name="id" value={gruppe.id} />
                <label style={{ margin: "0 0 .2rem" }}>Name</label>
                <input name="name" required maxLength={80} defaultValue={gruppe.name} />
                <label style={{ margin: ".6rem 0 .2rem" }}>Beschreibung</label>
                <input name="beschreibung" maxLength={300} defaultValue={gruppe.beschreibung ?? ""} placeholder="optional" />
                <div className="row" style={{ marginTop: ".7rem" }}>
                  <button className="btn small ghost">Speichern</button>
                </div>
              </form>
            </div>
          </div>

          <h2 style={{ marginTop: "1.6rem" }}>Seiten in dieser Gruppe</h2>
          {inGruppe.length === 0 ? (
            <div className="card">Noch keine Seite. Füge unten Seiten aus deiner Sammlung hinzu oder kreuze die Gruppe auf der Detailseite einer Lernseite an.</div>
          ) : (
            <>
              {ohneLink > 0 && link && (
                <p className="small-note" style={{ margin: "0 0 .6rem" }}>
                  {ohneLink === 1 ? "1 Seite hat" : `${ohneLink} Seiten haben`} noch keinen Freigabelink und {ohneLink === 1 ? "erscheint" : "erscheinen"} deshalb nicht auf der Klassenseite.
                </p>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Lernseite</th><th>Typ</th><th>Fach · Stufe</th><th>Für Lernende</th><th></th></tr>
                  </thead>
                  <tbody>
                    {inGruppe.map((p) => (
                      <tr key={p.id}>
                        <td><Link href={`/app/seiten/${p.id}`}><b>{p.title}</b></Link><br /><span className="small-note">{p.created_at}</span></td>
                        <td>{typOf(p.params)}</td>
                        <td>{p.fach}{p.stufe ? ` · ${p.stufe}` : ""}</td>
                        <td>
                          {p.share_token ? (
                            <a className="badge ok" href={`/s/${p.share_token}`} target="_blank" rel="noopener" style={{ margin: 0, textDecoration: "none" }}>Freigabelink ↗</a>
                          ) : (
                            <form action={sharePageFromGruppeAction} className="row" style={{ alignItems: "center" }}>
                              <input type="hidden" name="id" value={gruppe.id} />
                              <input type="hidden" name="seite" value={p.id} />
                              <button className="btn small ghost">Freigabelink erstellen</button>
                            </form>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <form action={removePageAction}>
                            <input type="hidden" name="id" value={gruppe.id} />
                            <input type="hidden" name="seite" value={p.id} />
                            <button className="btn small ghost" title="Aus der Gruppe entfernen, die Seite bleibt in der Sammlung">Entfernen</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <details className="card" style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Seiten aus der Sammlung hinzufügen{uebrige.length > 0 ? ` (${uebrige.length} verfügbar)` : ""}</summary>
            {uebrige.length === 0 ? (
              <p className="small-note" style={{ margin: ".8rem 0 0" }}>Alle deine Seiten liegen bereits in dieser Gruppe{alle.length === 0 ? ", beziehungsweise du hast noch keine Lernseite erzeugt" : ""}.</p>
            ) : (
              <form action={addPagesAction} style={{ marginTop: ".8rem" }}>
                <input type="hidden" name="id" value={gruppe.id} />
                <div className="checks">
                  {uebrige.map((p) => (
                    <label key={p.id} className="check">
                      <input type="checkbox" name="seite" value={p.id} />
                      <span>{p.title}</span>
                      <small>{typOf(p.params)} · {p.fach}{p.stufe ? ` · ${p.stufe}` : ""} · {p.created_at}{p.share_token ? " · Freigabelink" : ""}</small>
                    </label>
                  ))}
                </div>
                <button className="btn small">Ausgewählte hinzufügen</button>
              </form>
            )}
          </details>

          <form action={deleteGruppeAction} style={{ marginTop: "1.4rem" }}>
            <input type="hidden" name="id" value={gruppe.id} />
            <button className="btn ghost" style={{ color: "var(--err)" }}>Gruppe löschen</button>
            <span className="small-note" style={{ marginLeft: ".7rem" }}>Die Lernseiten bleiben in der Sammlung erhalten. Ein Klassenlink dieser Gruppe wird ungültig.</span>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
