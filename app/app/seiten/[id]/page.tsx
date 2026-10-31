import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getPage } from "@/lib/pages";
import { DIFFART_LABELS, NIVEAU_LABELS, SPRACHE_LABELS, TWIST_LABELS, type GenParams } from "@/lib/prompt";
import Topbar from "../../../Topbar";
import Footer from "../../../Footer";
import { coachAction, copyAction, deletePageAction, pageGruppenAction, renameAction, shareAction, visibilityAction } from "../actions";
import { gruppenOfPages, listGruppen } from "@/lib/gruppen";
import { coachAllowedFor, coachTopicsForPage, coachUsageForPage, defaultStilFor, COACH_DEN, COACH_DER_GROSS, COACH_NAME, COACH_STIL_LABELS, IS_GENERIC } from "@/lib/coach";
import { getMoodleBase } from "@/lib/moodle";
import CopyButton from "./CopyButton";
import MoodleCard from "./MoodleCard";

export const dynamic = "force-dynamic";

export default async function SeitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const userId = Number(session!.user.id);
  const isAdmin = session!.user.role === "admin";
  const page = await getPage(Number(id), userId, isAdmin);
  if (!page) notFound();
  const own = page.user_id === userId;
  const canEdit = own || isAdmin;
  const visibility = page.pool ? "all" : page.school && page.owner_institution ? "school" : "private";
  const moodleBase = canEdit ? await getMoodleBase(userId) : null;
  const coachOk = coachAllowedFor(page);
  const coachUse = canEdit && coachOk ? await coachUsageForPage(page.id) : null;
  const coachTopics = canEdit && coachOk && page.coach ? await coachTopicsForPage(page.id) : [];
  // Klassen und Gruppen der Besitzerin; Admins sehen die Gruppen der Besitzerin
  const gruppen = canEdit ? await listGruppen(page.user_id) : [];
  const inGruppen = new Set((canEdit ? (await gruppenOfPages([page.id])).get(page.id) ?? [] : []).map((g) => g.id));
  const p = page.params as Partial<GenParams>;
  const slug = page.title.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "lernseite";

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const shareUrl = page.share_token ? `${origin}/s/${page.share_token}` : null;
  const qr = shareUrl ? await QRCode.toDataURL(shareUrl, { margin: 1, width: 180, color: { dark: "#1E3246", light: "#ffffff" } }) : null;

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker"><Link href={own ? "/app/seiten" : page.pool ? "/app/seiten?modus=pool" : "/app/seiten?modus=schule"}>← {own ? "Meine Sammlung" : page.pool ? "Gemeinsamer Pool" : "Meine Schule"}</Link></p>
          <h1>{page.title}</h1>
          <p className="lead">
            {page.fach}{page.stufe ? ` · ${page.stufe}` : ""} · erzeugt am {page.created_at}
            {page.material_name ? ` aus «${page.material_name}»` : ""}
            {!own ? ` · von ${page.owner_name || page.owner_email}` : ""}
          </p>

          <div className="row" style={{ marginBottom: "1rem" }}>
            <a className="btn terra" href={`/app/seiten/${page.id}/html`} target="_blank" rel="noopener">In neuem Tab öffnen</a>
            <a className="btn" href={`/app/seiten/${page.id}/html?download=1`} download={`${slug}.html`}>HTML herunterladen</a>
            <a className="btn" href={`/app/seiten/${page.id}/docx`}>Word (Arbeitsblatt)</a>
            <a className="btn" href={`/app/seiten/${page.id}/scorm`}>SCORM für Moodle</a>
            {!own && (
              <form action={copyAction}>
                <input type="hidden" name="id" value={page.id} />
                <button className="btn ghost">In meine Sammlung kopieren</button>
              </form>
            )}
          </div>

          {canEdit && (
            <div className="grid" style={{ marginBottom: "1rem" }}>
              <div className="card">
                <p className="kicker">Für Lernende</p>
                <h3 style={{ margin: "0 0 .4rem" }}>Freigabelink</h3>
                {shareUrl ? (
                  <>
                    <p className="small-note">Wer den Link hat, kann die Seite ohne Login öffnen. Ideal für Moodle, Teams oder die Wandtafel.</p>
                    <div className="row" style={{ alignItems: "center" }}>
                      <input readOnly value={shareUrl} style={{ flex: "1 1 220px", fontSize: ".85rem" }} />
                      <CopyButton text={shareUrl} />
                    </div>
                    <div className="row" style={{ alignItems: "center", marginTop: ".8rem" }}>
                      {qr && <img src={qr} alt="QR-Code zum Freigabelink" width={120} height={120} style={{ borderRadius: 8, border: "1px solid var(--line)" }} />}
                      <div className="row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        {qr && <a className="btn small ghost" href={qr} download={`${slug}-qr.png`}>QR-Code speichern</a>}
                        <form action={shareAction}>
                          <input type="hidden" name="id" value={page.id} />
                          <input type="hidden" name="on" value="0" />
                          <button className="btn small ghost" style={{ color: "var(--err)" }}>Freigabe zurückziehen</button>
                        </form>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="small-note">Noch nicht freigegeben. Ein Freigabelink macht die Seite ohne Login erreichbar, bis du ihn zurückziehst.</p>
                    <form action={shareAction}>
                      <input type="hidden" name="id" value={page.id} />
                      <input type="hidden" name="on" value="1" />
                      <button className="btn small">Freigabelink erstellen</button>
                    </form>
                  </>
                )}
              </div>

              <div className="card">
                <p className="kicker">Für Kolleginnen und Kollegen</p>
                <h3 style={{ margin: "0 0 .4rem" }}>Sichtbarkeit</h3>
                <p className="small-note">
                  {visibility === "all"
                    ? "Diese Seite liegt im Pool. Alle angemeldeten Lehrpersonen können sie ansehen und kopieren."
                    : visibility === "school"
                    ? `Nur Lehrpersonen von «${page.owner_institution}» können diese Seite ansehen und kopieren.`
                    : "Nur du siehst diese Seite."}
                </p>
                <div className="row">
                  <form action={visibilityAction}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="v" value="private" /><button className={`btn small ${visibility === "private" ? "" : "ghost"}`}>Nur ich</button></form>
                  {page.owner_institution && (
  <form action={visibilityAction}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="v" value="school" /><button className={`btn small ${visibility === "school" ? "" : "ghost"}`}>Meine Schule</button></form>
                  )}
                  <form action={visibilityAction}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="v" value="all" /><button className={`btn small ${visibility === "all" ? "" : "ghost"}`}>Alle (Pool)</button></form>
                </div>
                <h3 style={{ margin: "1.2rem 0 .4rem" }}>Titel</h3>
                <form action={renameAction} className="row">
                  <input type="hidden" name="id" value={page.id} />
                  <input name="title" defaultValue={page.title} style={{ flex: "1 1 180px" }} />
                  <button className="btn small ghost">Speichern</button>
                </form>
              </div>

              <div className="card">
                <p className="kicker">Ordnung</p>
                <h3 style={{ margin: "0 0 .4rem" }}>Klassen und Gruppen</h3>
                {gruppen.length === 0 ? (
                  <p className="small-note">
                    Noch keine Gruppe angelegt. Mit Gruppen ordnest du die Sammlung nach Klassen oder Kursen und gibst pro Gruppe einen Klassenlink mit allen freigegebenen Seiten.
                    {" "}<Link href="/app/gruppen">Erste Gruppe anlegen</Link>
                  </p>
                ) : (
                  <form action={pageGruppenAction}>
                    <input type="hidden" name="id" value={page.id} />
                    <p className="small-note">
                      Diese Seite liegt in den angekreuzten Gruppen. Auf der Klassenseite einer Gruppe erscheint sie{shareUrl ? "" : " erst mit Freigabelink"}.
                    </p>
                    <div className="checks">
                      {gruppen.map((g) => (
                        <label key={g.id} className="check">
                          <input type="checkbox" name="gruppe" value={g.id} defaultChecked={inGruppen.has(g.id)} />
                          <span>{g.name}</span>
                          {g.share_token && <span className="badge ok" style={{ margin: 0 }}>Klassenlink</span>}
                        </label>
                      ))}
                    </div>
                    <div className="row">
                      <button className="btn small">Zuordnung speichern</button>
                      <Link className="btn small ghost" href="/app/gruppen">Gruppen verwalten</Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {canEdit && coachOk && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <p className="kicker">Für Lernende · Zusatzoption</p>
              <h3 style={{ margin: "0 0 .4rem" }}>{IS_GENERIC ? "Der Lerncoach" : `${COACH_NAME}, der Lerncoach`}</h3>
              {!page.owner_coach ? (
                <p className="small-note">
                  Der Lerncoach ist für dein Konto nicht freigeschaltet. Er beantwortet Fragen der Lernenden auf der Seite mit Gegenfragen und gestufter Hilfe, ohne Lösungen zu verraten.
                  Interesse? <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>
                </p>
              ) : (
                <>
                  <p className="small-note">
                    Erscheint als Knopf «Frag {COACH_DEN}» auf der Seite, wenn Lernende sie über den Freigabelink öffnen. Kennt Aufgaben und deine Lösungen, verrät sie aber nicht.
                    Gespräche werden nicht gespeichert. {page.share_token ? "" : "Dazu braucht die Seite einen Freigabelink."}
                    {coachUse ? ` Diesen Monat ${coachUse.month} Nachrichten, insgesamt ${coachUse.total}.` : ""}
                  </p>
                  <form action={coachAction} className="row" style={{ alignItems: "flex-end" }}>
                    <input type="hidden" name="id" value={page.id} />
                    <input type="hidden" name="on" value="1" />
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={{ margin: "0 0 .2rem" }}>Stil</label>
                      <select name="stil" defaultValue={page.coach ? page.coach_stil : defaultStilFor(page)}>
                        {Object.entries(COACH_STIL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: "1 1 160px" }}>
                      <label style={{ margin: "0 0 .2rem" }}>KI</label>
                      <select name="provider" defaultValue={page.coach_provider}>
                        <option value="infomaniak">Infomaniak (Schweiz)</option>
                        <option value="claude">Claude (USA)</option>
                      </select>
                    </div>
                    <button className={`btn small ${page.coach ? "" : "ghost"}`}>{page.coach ? "Eingeschaltet · Änderungen speichern" : "Einschalten"}</button>
                  </form>
                  {page.coach && (
                    <form action={coachAction} style={{ marginTop: ".5rem" }}>
                      <input type="hidden" name="id" value={page.id} />
                      <input type="hidden" name="on" value="0" />
                      <input type="hidden" name="stil" value={page.coach_stil} />
                      <input type="hidden" name="provider" value={page.coach_provider} />
                      <button className="btn small ghost" style={{ color: "var(--err)" }}>Coach ausschalten</button>
                    </form>
                  )}
                  {coachTopics.length > 0 && (
                    <div style={{ marginTop: ".9rem" }}>
                      <p className="small-note" style={{ margin: "0 0 .3rem" }}>Fragen an {COACH_DEN} in diesem Monat, nach Teil oder Zugang (anonym, ohne Inhalte):</p>
                      <table style={{ maxWidth: 420 }}>
                        <tbody>
                          {coachTopics.map((t) => <tr key={t.reiter}><td>{t.reiter}</td><td style={{ textAlign: "right", width: 60 }}>{t.n}</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {canEdit && <MoodleCard pageId={page.id} title={page.title} connectedBase={moodleBase} />}

          <details className="card" style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Lernseite von Hand in Moodle einfügen</summary>
            <div className="grid" style={{ marginTop: ".8rem" }}>
              <div>
                <h3 style={{ margin: "0 0 .3rem" }}>Variante A · SCORM-Paket</h3>
                <p className="small-note">Moodle zeichnet auf, wer die Seite geöffnet hat (Status «abgeschlossen»). Funktioniert in jedem Moodle, auch ohne Internetzugang zu lernwege.</p>
                <ol style={{ paddingLeft: "1.2rem", margin: ".3rem 0 0", fontSize: ".9rem" }}>
                  <li>Oben <b>SCORM für Moodle</b> klicken, Zip speichern.</li>
                  <li>Im Moodle-Kurs: Bearbeiten einschalten → Aktivität hinzufügen → <b>Lernpaket (SCORM)</b>.</li>
                  <li>Zip in das Feld «Paketdatei» ziehen, Name vergeben, speichern.</li>
                  <li>Empfehlung unter «Darstellung»: Paket anzeigen = <b>Neues Fenster</b>, Navigation ausblenden.</li>
                </ol>
              </div>
              <div>
                <h3 style={{ margin: "0 0 .3rem" }}>Variante B · Freigabelink</h3>
                <p className="small-note">Schneller, immer die aktuelle Version. Moodle zeichnet keinen Abschluss auf.</p>
                <ol style={{ paddingLeft: "1.2rem", margin: ".3rem 0 0", fontSize: ".9rem" }}>
                  <li>Freigabelink erstellen (Karte oben) und kopieren.</li>
                  <li>Im Moodle-Kurs: Aktivität hinzufügen → <b>Link/URL</b>, Adresse einfügen.</li>
                  <li>Darstellung «Einbetten» zeigt die Seite direkt im Kurs.</li>
                </ol>
              </div>
            </div>
          </details>

          <iframe className="preview" src={`/app/seiten/${page.id}/html`} title={page.title} />

          <details className="card" style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Details zur Erzeugung</summary>
            <table style={{ marginTop: ".8rem" }}>
              <tbody>
                <tr><th>Typ</th><td>{p.typ === "pruefung" ? `Prüfungsvorbereitung (Übungsprüfung ${p.dauer ?? 30} Minuten)` : p.typ === "spiel" ? "Lernspiel (vier Levels)" : p.typ === "hilfe" ? "Lernhilfe (Merkblatt, Lernkarten, Glossar)" : "Lernseite"}</td></tr>
                {(p.typ ?? "lernseite") === "lernseite" && <tr><th>Differenzierung</th><td>{p.diffart ? DIFFART_LABELS[p.diffart] : "–"}{p.anzahl ? `, ${p.anzahl} Zugänge` : ""}</td></tr>}
                <tr><th>Sprache</th><td>{p.sprache ? SPRACHE_LABELS[p.sprache] : "–"}{p.zweitsprache ? ` (${p.zweitsprache})` : ""}</td></tr>
                {(p.typ ?? "lernseite") === "lernseite" && <tr><th>Twist</th><td>{p.twist ? TWIST_LABELS[p.twist] : "–"}</td></tr>}
                {(p.typ ?? "lernseite") === "lernseite" && <tr><th>Niveau</th><td>{p.niveau ? NIVEAU_LABELS[p.niveau] : "–"}</td></tr>}
                {p.extra && <tr><th>Zusatzwunsch</th><td>{p.extra}</td></tr>}
                {p.bild && <tr><th>Bild</th><td><Link href={`/app/bilder/${p.bild.id}`}>{p.bild.title}</Link> (als Bildaufgabe eingebunden)</td></tr>}
                <tr><th>Modell</th><td>{page.provider === "beispiel" ? "Beispielseite von der Startseite" : `${page.provider} · ${page.model}`}</td></tr>
                <tr><th>Tokens</th><td>{page.input_tokens.toLocaleString("de-CH")} ein / {page.output_tokens.toLocaleString("de-CH")} aus{page.duration_ms ? ` · ${Math.round(page.duration_ms / 1000)} s` : ""}</td></tr>
                <tr><th>Grösse</th><td>{Math.round(page.html_bytes / 1024)} KB</td></tr>
                {page.copied_from && <tr><th>Kopie</th><td>aus freigegebener Seite #{page.copied_from}</td></tr>}
                {page.notiz && <tr><th>Notiz der KI</th><td>{page.notiz}</td></tr>}
              </tbody>
            </table>
          </details>

          {canEdit && (
            <form action={deletePageAction} style={{ marginTop: "1rem" }}>
              <input type="hidden" name="id" value={page.id} />
              <button className="btn ghost" style={{ color: "var(--err)" }}>Lernseite löschen</button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
