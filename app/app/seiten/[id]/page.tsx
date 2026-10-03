import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getPage } from "@/lib/pages";
import { DIFFART_LABELS, NIVEAU_LABELS, SPRACHE_LABELS, TWIST_LABELS, type GenParams } from "@/lib/prompt";
import Topbar from "../../../Topbar";
import { copyAction, deletePageAction, poolAction, renameAction, shareAction } from "../actions";
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
  const moodleBase = canEdit ? await getMoodleBase(userId) : null;
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
          <p className="kicker"><Link href={own ? "/app/seiten" : "/app/seiten?modus=pool"}>← {own ? "Meine Sammlung" : "Gemeinsamer Pool"}</Link></p>
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
                <h3 style={{ margin: "0 0 .4rem" }}>Gemeinsamer Pool</h3>
                <p className="small-note">
                  {page.pool ? "Diese Seite liegt im Pool. Alle angemeldeten Lehrpersonen können sie ansehen und kopieren." : "Nur du siehst diese Seite. Im Pool können andere Lehrpersonen sie ansehen und in ihre Sammlung kopieren."}
                </p>
                <form action={poolAction}>
                  <input type="hidden" name="id" value={page.id} />
                  <input type="hidden" name="on" value={page.pool ? "0" : "1"} />
                  <button className={`btn small ${page.pool ? "ghost" : ""}`}>{page.pool ? "Aus dem Pool nehmen" : "In den Pool stellen"}</button>
                </form>
                <h3 style={{ margin: "1.2rem 0 .4rem" }}>Titel</h3>
                <form action={renameAction} className="row">
                  <input type="hidden" name="id" value={page.id} />
                  <input name="title" defaultValue={page.title} style={{ flex: "1 1 180px" }} />
                  <button className="btn small ghost">Speichern</button>
                </form>
              </div>
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
                <tr><th>Differenzierung</th><td>{p.diffart ? DIFFART_LABELS[p.diffart] : "–"}{p.anzahl ? `, ${p.anzahl} Zugänge` : ""}</td></tr>
                <tr><th>Sprache</th><td>{p.sprache ? SPRACHE_LABELS[p.sprache] : "–"}{p.zweitsprache ? ` (${p.zweitsprache})` : ""}</td></tr>
                <tr><th>Twist</th><td>{p.twist ? TWIST_LABELS[p.twist] : "–"}</td></tr>
                <tr><th>Niveau</th><td>{p.niveau ? NIVEAU_LABELS[p.niveau] : "–"}</td></tr>
                {p.extra && <tr><th>Zusatzwunsch</th><td>{p.extra}</td></tr>}
                <tr><th>Modell</th><td>{page.provider === "beispiel" ? "Beispielseite von der Startseite" : `${page.provider} · ${page.model}`}</td></tr>
                <tr><th>Tokens</th><td>{page.input_tokens.toLocaleString("de-CH")} ein / {page.output_tokens.toLocaleString("de-CH")} aus{page.duration_ms ? ` · ${Math.round(page.duration_ms / 1000)} s` : ""}</td></tr>
                <tr><th>Grösse</th><td>{Math.round(page.html_bytes / 1024)} KB</td></tr>
                {page.copied_from && <tr><th>Kopie</th><td>aus Pool-Seite #{page.copied_from}</td></tr>}
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
    </>
  );
}
