import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getPage } from "@/lib/pages";
import { DIFFART_LABELS, NIVEAU_LABELS, SPRACHE_LABELS, TWIST_LABELS, normalizeLernseite, type GenParams } from "@/lib/prompt";
import { SOZIALFORMEN, zugangOptionen } from "@/lib/achsen";
import AppShell from "../../../AppShell";
import { coachAction, copyAction, deletePageAction, pageGruppenAction, renameAction, shareAction, visibilityAction } from "../actions";
import { gruppenOfPages, listGruppen } from "@/lib/gruppen";
import { coachAllowedFor, coachTopicsForPage, coachUsageForPage, defaultStilFor, COACH_DEN, COACH_NAME, COACH_STIL_LABELS, IS_GENERIC } from "@/lib/coach";
import { getMoodleBase } from "@/lib/moodle";
import CopyButton from "./CopyButton";
import MoodleCard from "./MoodleCard";

export const dynamic = "force-dynamic";

const TYP_NAME: Record<string, string> = { lernseite: "Lernseite", arbeitsblatt: "Arbeitsblatt", pruefung: "Prüfungsvorbereitung", spiel: "Lernspiel", hilfe: "Lernhilfe" };

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
  const topicMax = Math.max(1, ...coachTopics.map((t) => t.n));
  // Klassen und Gruppen der Besitzerin; Admins sehen die Gruppen der Besitzerin
  const gruppen = canEdit ? await listGruppen(page.user_id) : [];
  const inGruppen = new Set((canEdit ? (await gruppenOfPages([page.id])).get(page.id) ?? [] : []).map((g) => g.id));
  const meineGruppen = gruppen.filter((g) => inGruppen.has(g.id));
  const p = page.params as Partial<GenParams>;
  // Achsen der Lernseite, auch für alte Seiten (Anzahl Zugänge, Sozialform als Differenzierungsart)
  const achsenTyp = ["lernseite", "arbeitsblatt"].includes(p.typ ?? "lernseite");
  const achsen = normalizeLernseite(p);
  const zugangNamen = zugangOptionen(achsen.diffart, achsen.eigeneBerufsfelder).filter((o) => achsen.zugaenge.includes(o.v)).map((o) => o.name);
  const sozialNamen = SOZIALFORMEN.filter((o) => achsen.sozialformen.includes(o.v)).map((o) => o.name);
  const slug = page.title.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "lernseite";
  const stil = page.coach ? page.coach_stil : defaultStilFor(page);
  const back = own ? ["/app/seiten", "Sammlung"] : page.pool ? ["/app/seiten?modus=pool", "Gemeinsamer Pool"] : ["/app/seiten?modus=schule", "Meine Schule"];
  const meta = [
    TYP_NAME[p.typ ?? "lernseite"] ?? "Lernseite",
    page.fach, page.stufe,
    achsenTyp ? `Zugänge ${zugangNamen.map((_, i) => String.fromCharCode(65 + i)).join(", ")}` : null,
    achsenTyp ? sozialNamen.join(", ") : null,
    !own ? `von ${page.owner_name || page.owner_email}` : null,
  ].filter(Boolean).join(" · ");

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const shareUrl = page.share_token ? `${origin}/s/${page.share_token}` : null;
  const qr = shareUrl ? await QRCode.toDataURL(shareUrl, { margin: 1, width: 180, color: { dark: "#1E3246", light: "#ffffff" } }) : null;

  return (
    <AppShell active="sammlung">
      <nav className="crumb" aria-label="Brotkrumen"><Link href={back[0]}>{back[1]}</Link> <span aria-hidden="true">/</span> {page.title}</nav>
      <header className="page-head">
        <div>
          <h1>{page.title}</h1>
          <p>{meta}</p>
        </div>
        <div className="head-acts">
          <a className="btn ghost" href={`/app/seiten/${page.id}/html`} target="_blank" rel="noopener">Als Lernende ansehen</a>
          {!own && (
            <form action={copyAction}>
              <input type="hidden" name="id" value={page.id} />
              <button className="btn terra">In meine Sammlung kopieren</button>
            </form>
          )}
        </div>
      </header>

      <div className="detail">
        <section className="box pv" aria-label="Vorschau">
          <div className="pv-head">
            <span>Vorschau, wie Lernende die Seite sehen</span>
            <span>Läuft offline · eine Datei</span>
          </div>
          <iframe className="preview" src={`/app/seiten/${page.id}/html`} title={`Vorschau: ${page.title}`} />
        </section>

        <div className="detail-side">
          {canEdit && (
            <section className="share" aria-labelledby="h-fr">
              <div className="between">
                <h2 id="h-fr">Freigabe</h2>
                <span className="share-state">{shareUrl ? "Aktiv" : "Aus"}</span>
              </div>
              {shareUrl ? (
                <>
                  <div className="share-row">
                    {qr && <img src={qr} alt="QR-Code zum Freigabelink" width={96} height={96} />}
                    <div>
                      <label htmlFor="lnk">Freigabelink, ohne Konto</label>
                      <input id="lnk" type="text" readOnly value={shareUrl} />
                    </div>
                  </div>
                  <div className="share-acts">
                    <CopyButton text={shareUrl} className="btn terra" />
                    {qr && <a className="btn on-navy" href={qr} download={`${slug}-qr.png`}>QR-Code speichern</a>}
                  </div>
                  <p className="share-note">
                    Wer den Link hat, öffnet die Seite ohne Login.
                    {meineGruppen.length > 0 ? ` Im Klassenlink ${meineGruppen.map((g) => `«${g.name}»`).join(", ")}.` : ""}
                  </p>
                  <form action={shareAction}>
                    <input type="hidden" name="id" value={page.id} />
                    <input type="hidden" name="on" value="0" />
                    <button className="share-off">Freigabe zurückziehen</button>
                  </form>
                </>
              ) : (
                <>
                  <p className="share-note">Noch nicht freigegeben. Ein Freigabelink macht die Seite ohne Login erreichbar, bis du ihn zurückziehst.</p>
                  <form action={shareAction} className="share-acts">
                    <input type="hidden" name="id" value={page.id} />
                    <input type="hidden" name="on" value="1" />
                    <button className="btn terra">Freigabelink erstellen</button>
                  </form>
                </>
              )}
            </section>
          )}

          {canEdit && coachOk && (
            <section className="box pad block" aria-labelledby="h-co">
              <div className="between">
                <h2 id="h-co">{IS_GENERIC ? "Coach" : COACH_NAME}</h2>
                {page.owner_coach && (
                  <form action={coachAction}>
                    <input type="hidden" name="id" value={page.id} />
                    <input type="hidden" name="on" value={page.coach ? "0" : "1"} />
                    <input type="hidden" name="stil" value={stil} />
                    <input type="hidden" name="provider" value={page.coach_provider} />
                    <button className="switch" role="switch" aria-checked={page.coach} aria-label="Coach für diese Seite"><span><i /></span></button>
                  </form>
                )}
              </div>
              {!page.owner_coach ? (
                <p className="box-text soft">
                  Der Lerncoach ist für dein Konto nicht freigeschaltet. Er beantwortet Fragen der Lernenden auf der Seite mit Gegenfragen und gestufter Hilfe, ohne Lösungen zu verraten.
                  Interesse? <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>
                </p>
              ) : (
                <>
                  <p className="box-text soft">
                    Erscheint als Knopf «Frag {COACH_DEN}», wenn Lernende die Seite über den Freigabelink öffnen. Kennt Aufgaben und deine Lösungen, verrät sie aber nicht. Gespräche werden nicht gespeichert.
                    {page.share_token ? "" : " Dazu braucht die Seite einen Freigabelink."}
                    {coachUse ? ` Diesen Monat ${coachUse.month} Nachrichten, insgesamt ${coachUse.total}.` : ""}
                  </p>
                  {page.coach && (
                    <>
                      <div className="opts" role="group" aria-label="Stil">
                        {Object.entries(COACH_STIL_LABELS).map(([k, v]) => {
                          const [name, note] = v.replace(/\)$/, "").split(" (");
                          return (
                            <form action={coachAction} key={k}>
                              <input type="hidden" name="id" value={page.id} />
                              <input type="hidden" name="on" value="1" />
                              <input type="hidden" name="stil" value={k} />
                              <input type="hidden" name="provider" value={page.coach_provider} />
                              <button className={`opt${page.coach_stil === k ? " on" : ""}`} aria-pressed={page.coach_stil === k}>
                                <b>{name.charAt(0).toUpperCase() + name.slice(1)}</b>{note && <small>{note.charAt(0).toUpperCase() + note.slice(1)}</small>}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                      <div>
                        <div className="mini-label" id="l-ki">KI für den Coach</div>
                        <div className="row" role="group" aria-labelledby="l-ki">
                          {([["infomaniak", "Infomaniak (Schweiz)"], ["claude", "Claude (USA)"]] as const).filter(([k]) => !page.owner_swiss_only || k === "infomaniak").map(([k, v]) => (
                            <form action={coachAction} key={k}>
                              <input type="hidden" name="id" value={page.id} />
                              <input type="hidden" name="on" value="1" />
                              <input type="hidden" name="stil" value={page.coach_stil} />
                              <input type="hidden" name="provider" value={k} />
                              <button className={`btn small ${(page.owner_swiss_only ? "infomaniak" : page.coach_provider) === k ? "" : "ghost"}`} aria-pressed={(page.owner_swiss_only ? "infomaniak" : page.coach_provider) === k}>{v}</button>
                            </form>
                          ))}
                        </div>
                      </div>
                      {coachTopics.length > 0 && (
                        <div className="bars">
                          <div className="mini-label">Wo die Fragen kamen, anonym, diesen Monat</div>
                          {coachTopics.map((t) => (
                            <div className="bar" key={t.reiter}>
                              <span>{t.reiter}</span>
                              <span className="track" aria-hidden="true"><span style={{ width: `${Math.round((t.n / topicMax) * 100)}%` }} /></span>
                              <span className="n">{t.n}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          )}

          <section className="box pad block" aria-labelledby="h-ex">
            <h2 id="h-ex">Einsetzen</h2>
            <div className="exps">
              {canEdit && <a className="exp" href="#moodle"><b>In Moodle legen</b><small>Kurs wählen</small></a>}
              <a className="exp" href={`/app/seiten/${page.id}/docx`}><b>Word-Arbeitsblatt</b><small>zum Drucken und Anpassen</small></a>
              <a className="exp" href={`/app/seiten/${page.id}/scorm`}><b>SCORM-Paket</b><small>für Moodle und andere LMS</small></a>
              <a className="exp" href={`/app/seiten/${page.id}/html?download=1`} download={`${slug}.html`}><b>HTML-Datei</b><small>offline weitergeben</small></a>
            </div>
          </section>
        </div>
      </div>

      {canEdit && (
        <div className="manage">
          <section className="box pad block" aria-labelledby="h-si">
            <h2 id="h-si">Sichtbarkeit für Kolleginnen und Kollegen</h2>
            <p className="box-text soft">
              {visibility === "all"
                ? "Diese Seite liegt im Pool. Alle angemeldeten Lehrpersonen können sie ansehen und kopieren."
                : visibility === "school"
                ? `Nur Lehrpersonen von «${page.owner_institution}» können diese Seite ansehen und kopieren.`
                : "Nur du siehst diese Seite."}
            </p>
            <div className="row">
              <form action={visibilityAction}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="v" value="private" /><button className={`btn small ${visibility === "private" ? "" : "ghost"}`} aria-pressed={visibility === "private"}>Nur ich</button></form>
              {page.owner_institution && (
                <form action={visibilityAction}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="v" value="school" /><button className={`btn small ${visibility === "school" ? "" : "ghost"}`} aria-pressed={visibility === "school"}>Meine Schule</button></form>
              )}
              <form action={visibilityAction}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="v" value="all" /><button className={`btn small ${visibility === "all" ? "" : "ghost"}`} aria-pressed={visibility === "all"}>Alle (Pool)</button></form>
            </div>
          </section>

          <section className="box pad block" aria-labelledby="h-ti">
            <h2 id="h-ti">Titel</h2>
            <form action={renameAction} className="row stretch">
              <input type="hidden" name="id" value={page.id} />
              <label htmlFor="titel" className="sr">Titel der Seite</label>
              <input id="titel" name="title" defaultValue={page.title} style={{ flex: "1 1 180px" }} />
              <button className="btn small ghost">Speichern</button>
            </form>
          </section>

          <section className="box pad block" aria-labelledby="h-gr">
            <h2 id="h-gr">Klassen und Gruppen</h2>
            {gruppen.length === 0 ? (
              <p className="box-text soft">
                Noch keine Gruppe angelegt. Mit Gruppen ordnest du die Sammlung nach Klassen oder Kursen und gibst pro Gruppe einen Klassenlink mit allen freigegebenen Seiten.
                {" "}<Link href="/app/gruppen">Erste Gruppe anlegen</Link>
              </p>
            ) : (
              <form action={pageGruppenAction}>
                <input type="hidden" name="id" value={page.id} />
                <p className="box-text soft">
                  Diese Seite liegt in den angekreuzten Gruppen. Auf der Klassenseite einer Gruppe erscheint sie{shareUrl ? "" : " erst mit Freigabelink"}.
                </p>
                <div className="checks">
                  {gruppen.map((g) => (
                    <label key={g.id} className="check tall">
                      <input type="checkbox" name="gruppe" value={g.id} defaultChecked={inGruppen.has(g.id)} />
                      <span>{g.name}</span>
                      {g.share_token && <span className="tag frei">Klassenlink</span>}
                    </label>
                  ))}
                </div>
                <div className="row">
                  <button className="btn small">Zuordnung speichern</button>
                  <Link className="btn small ghost" href="/app/gruppen">Gruppen verwalten</Link>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {canEdit && <MoodleCard pageId={page.id} title={page.title} connectedBase={moodleBase} />}

      <details className="box fold">
        <summary>Lernseite von Hand in Moodle einfügen</summary>
        <div className="grid two">
          <div>
            <h3>Variante A · SCORM-Paket</h3>
            <p className="small-note">Moodle zeichnet auf, wer die Seite geöffnet hat (Status «abgeschlossen»). Funktioniert in jedem Moodle, auch ohne Internetzugang zu lernwege.</p>
            <ol>
              <li>Unter «Einsetzen» <b>SCORM-Paket</b> klicken, Zip speichern.</li>
              <li>Im Moodle-Kurs: Bearbeiten einschalten → Aktivität hinzufügen → <b>Lernpaket (SCORM)</b>.</li>
              <li>Zip in das Feld «Paketdatei» ziehen, Name vergeben, speichern.</li>
              <li>Empfehlung unter «Darstellung»: Paket anzeigen = <b>Neues Fenster</b>, Navigation ausblenden.</li>
            </ol>
          </div>
          <div>
            <h3>Variante B · Freigabelink</h3>
            <p className="small-note">Schneller, immer die aktuelle Version. Moodle zeichnet keinen Abschluss auf.</p>
            <ol>
              <li>Freigabelink erstellen (Karte «Freigabe») und kopieren.</li>
              <li>Im Moodle-Kurs: Aktivität hinzufügen → <b>Link/URL</b>, Adresse einfügen.</li>
              <li>Darstellung «Einbetten» zeigt die Seite direkt im Kurs.</li>
            </ol>
          </div>
        </div>
      </details>

      <details className="box fold">
        <summary>Details zur Erzeugung</summary>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><th>Typ</th><td>{p.typ === "pruefung" ? `Prüfungsvorbereitung (Übungsprüfung ${p.dauer ?? 30} Minuten)` : p.typ === "spiel" ? "Lernspiel (vier Levels)" : p.typ === "hilfe" ? "Lernhilfe (Merkblatt, Lernkarten, Glossar)" : p.typ === "arbeitsblatt" ? "Arbeitsblatt" : "Lernseite"}</td></tr>
              <tr><th>Erzeugt</th><td>{page.created_at}{page.material_name ? ` aus «${page.material_name}»` : ""}</td></tr>
              {achsenTyp && <tr><th>Differenzierung</th><td>{DIFFART_LABELS[achsen.diffart]}: {zugangNamen.join(", ")}</td></tr>}
              {achsenTyp && <tr><th>Sozialform</th><td>{sozialNamen.join(", ")}</td></tr>}
              <tr><th>Sprache</th><td>{p.sprache ? SPRACHE_LABELS[p.sprache] : "–"}{p.zweitsprache ? ` (${p.zweitsprache})` : ""}</td></tr>
              {achsenTyp && <tr><th>Twist</th><td>{p.twist ? TWIST_LABELS[p.twist] : "–"}</td></tr>}
              {achsenTyp && <tr><th>Niveau</th><td>{p.niveau ? NIVEAU_LABELS[p.niveau] : "–"}</td></tr>}
              {p.extra && <tr><th>Zusatzwunsch</th><td>{p.extra}</td></tr>}
              {p.aufgaben && <tr><th>Aufgaben</th><td>{p.aufgaben} pro Zugang</td></tr>}
              {p.aufgabenText && <tr><th>Aufgabenvorgaben</th><td style={{ whiteSpace: "pre-wrap" }}>{p.aufgabenText}</td></tr>}
              {p.latex && <tr><th>Formeln</th><td>LaTeX (als MathML gesetzt)</td></tr>}
              {p.bild && <tr><th>Bild</th><td><Link href={`/app/bilder/${p.bild.id}`}>{p.bild.title}</Link> (als Bildaufgabe eingebunden)</td></tr>}
              <tr><th>Modell</th><td>{page.provider === "beispiel" ? "Beispielseite von der Startseite" : `${page.provider} · ${page.model}`}</td></tr>
              <tr><th>Tokens</th><td>{page.input_tokens.toLocaleString("de-CH")} ein / {page.output_tokens.toLocaleString("de-CH")} aus{page.duration_ms ? ` · ${Math.round(page.duration_ms / 1000)} s` : ""}</td></tr>
              <tr><th>Grösse</th><td>{Math.round(page.html_bytes / 1024)} KB</td></tr>
              {page.copied_from && <tr><th>Kopie</th><td>aus freigegebener Seite #{page.copied_from}</td></tr>}
              {page.notiz && <tr><th>Notiz der KI</th><td>{page.notiz}</td></tr>}
            </tbody>
          </table>
        </div>
      </details>

      {canEdit && (
        <form action={deletePageAction} className="danger">
          <input type="hidden" name="id" value={page.id} />
          <button className="btn ghost">Lernseite löschen</button>
        </form>
      )}
    </AppShell>
  );
}
