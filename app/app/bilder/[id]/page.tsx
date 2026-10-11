import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { EINSATZ_LABELS, TASKS, encodeState, fixes, labelText, normalize, recipeLines, type Einsatz } from "@/lib/bildprompt";
import { imageProviderReady } from "@/lib/imagegen";
import { getImageMeta, imageFamily } from "@/lib/images";
import { imageQuotaFor } from "@/lib/quota";
import Topbar from "../../../Topbar";
import { copyImageAction, deleteImageAction, exampleImageAction, renameImageAction, shareImageAction, visibilityImageAction } from "../actions";
import CopyText from "./CopyText";
import EditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function BildPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const userId = Number(session!.user.id);
  const isAdmin = session!.user.role === "admin";
  const img = await getImageMeta(Number(id), userId, isAdmin);
  if (!img) notFound();
  const own = img.user_id === userId;
  const canEdit = own || isAdmin;
  const state = normalize(img.params);
  const family = await imageFamily(img.id, img.parent_id, userId, isAdmin);
  const quota = await imageQuotaFor(userId, isAdmin);
  const exhausted = quota.limit !== null && quota.used >= quota.limit;
  const einsatz = (img.einsatz ?? state.e) as Einsatz;
  const label = labelText(img.provider === "openai" ? "OpenAI gpt-image" : "Infomaniak Flux", new Date());
  const recipe = recipeLines(state);
  const visibility = img.pool ? "all" : img.school && img.owner_institution ? "school" : "private";

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const shareUrl = img.share_token ? `${origin}/b/${img.share_token}` : null;
  const slug = img.title.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "bild";
  const back = own ? ["/app/bilder", "Meine Bilder"] : img.pool ? ["/app/bilder?modus=pool", "Bilder-Pool"] : img.school ? ["/app/bilder?modus=schule", "Meine Schule"] : ["/app/bilder?modus=alle", "Alle Bilder"];

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker"><Link href={back[0]}>← {back[1]}</Link></p>
          <h1>{img.title}</h1>
          <p className="lead">
            {EINSATZ_LABELS[einsatz] ?? einsatz} · erzeugt am {img.created_at} · {img.size}
            {img.instruction ? " · nachgebesserte Variante" : ""}
            {img.copied_from ? " · Kopie" : ""}
            {!own ? ` · von ${img.owner_name || img.owner_email}` : ""}
          </p>

          <img className="hero-img" src={`/app/bilder/${img.id}/jpg`} alt={img.title} />

          <div className="row" style={{ margin: "1rem 0" }}>
            <a className="btn terra" href={`/app/bilder/${img.id}/jpg?download=1`} download={`${slug}.jpg`}>Bild herunterladen</a>
            <a className="btn" href={`/app/bilder/${img.id}/jpg`} target="_blank" rel="noopener">In neuem Tab öffnen</a>
            {canEdit && <Link className="btn" href={`/app/erzeugen?bild=${img.id}`}>In eine Lernseite einbauen</Link>}
            <Link className="btn ghost" href={`/app/bilder/erzeugen?r=${encodeState(state)}`}>Rezept anpassen, neu erzeugen</Link>
            {!own && (
              <form action={copyImageAction}>
                <input type="hidden" name="id" value={img.id} />
                <button className="btn ghost">In meine Sammlung kopieren</button>
              </form>
            )}
          </div>

          {family.length > 1 && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <p className="kicker">Varianten</p>
              <div className="row" style={{ gap: ".6rem" }}>
                {family.map((f, i) => (
                  <Link key={f.id} href={`/app/bilder/${f.id}`} title={f.instruction ?? "Ausgangsbild"} style={{ border: f.id === img.id ? "2px solid var(--terra)" : "1px solid var(--line)", borderRadius: 10, overflow: "hidden", width: 150, textDecoration: "none", color: "inherit", background: "#fff" }}>
                    <img src={`/app/bilder/${f.id}/jpg`} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                    <span className="small-note" style={{ display: "block", padding: ".3rem .5rem" }}>{i === 0 ? "Ausgangsbild" : `Schritt ${i}`}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid" style={{ marginBottom: "1rem" }}>
            {canEdit && (
              <div className="card">
                <p className="kicker">Prüfen und nachbessern</p>
                <h3 style={{ margin: "0 0 .4rem" }}>Nachbessern, eine Sache nach der anderen</h3>
                <EditForm imageId={img.id} suggestions={fixes(state)} canEdit={imageProviderReady("openai")} exhausted={exhausted} />
              </div>
            )}

            <div className="card">
              <p className="kicker">Für den Unterricht</p>
              <h3 style={{ margin: "0 0 .4rem" }}>Arbeitsauftrag</h3>
              <p style={{ background: "var(--cream)", borderLeft: "4px solid var(--ochre)", borderRadius: "0 10px 10px 0", padding: ".7rem .9rem", margin: "0 0 .6rem", fontSize: ".92rem" }}>«{TASKS[einsatz] ?? TASKS.beschreiben}»</p>
              <CopyText text={TASKS[einsatz] ?? TASKS.beschreiben} label="Arbeitsauftrag kopieren" />
              <h3 style={{ margin: "1.2rem 0 .4rem" }}>Kennzeichnung fürs Material</h3>
              <p style={{ background: "var(--cream)", borderLeft: "4px solid var(--ochre)", borderRadius: "0 10px 10px 0", padding: ".7rem .9rem", margin: "0 0 .6rem", fontSize: ".92rem" }}>{label}</p>
              <CopyText text={label} label="Kennzeichnung kopieren" />
              <h3 style={{ margin: "1.2rem 0 .4rem" }}>Nach dem Generieren prüfen</h3>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: ".9rem" }}>
                <li><b>Fachlich:</b> Stimmen Gegenstände, Abläufe und Zusammenhänge?</li>
                <li><b>Didaktisch:</b> Können die Lernenden damit die geplante Aufgabe bearbeiten?</li>
                <li><b>Darstellung:</b> Was ist unklar, ablenkend oder stereotyp?</li>
                <li><b>Verwendung:</b> Ist das Bild als KI-generiert und fiktiv gekennzeichnet?</li>
              </ol>
            </div>

            {canEdit && (
              <div className="card">
                <p className="kicker">Für Lernende und Moodle</p>
                <h3 style={{ margin: "0 0 .4rem" }}>Bildlink</h3>
                {shareUrl ? (
                  <>
                    <p className="small-note">Wer den Link hat, sieht das Bild ohne Login. Als Bild-URL in Moodle, Teams oder in einer Lernseite verwendbar.</p>
                    <div className="row" style={{ alignItems: "center" }}>
                      <input readOnly value={shareUrl} style={{ flex: "1 1 220px", fontSize: ".85rem" }} />
                      <CopyText text={shareUrl} label="Link kopieren" />
                    </div>
                    {!img.beispiel && (
                      <form action={shareImageAction} style={{ marginTop: ".8rem" }}>
                        <input type="hidden" name="id" value={img.id} />
                        <input type="hidden" name="on" value="0" />
                        <button className="btn small ghost" style={{ color: "var(--err)" }}>Freigabe zurückziehen</button>
                      </form>
                    )}
                  </>
                ) : (
                  <>
                    <p className="small-note">Noch nicht freigegeben. Ein Bildlink macht das Bild ohne Login erreichbar, bis du ihn zurückziehst.</p>
                    <form action={shareImageAction}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="on" value="1" />
                      <button className="btn small">Bildlink erstellen</button>
                    </form>
                  </>
                )}
                <h3 style={{ margin: "1.2rem 0 .4rem" }}>Titel</h3>
                <form action={renameImageAction} className="row">
                  <input type="hidden" name="id" value={img.id} />
                  <input name="title" defaultValue={img.title} style={{ flex: "1 1 180px" }} />
                  <button className="btn small ghost">Speichern</button>
                </form>
              </div>
            )}

            {canEdit && (
              <div className="card">
                <p className="kicker">Für Kolleginnen und Kollegen</p>
                <h3 style={{ margin: "0 0 .4rem" }}>Sichtbarkeit</h3>
                <p className="small-note">
                  {visibility === "all"
                    ? "Dieses Bild liegt im Pool. Alle angemeldeten Lehrpersonen können es ansehen und kopieren."
                    : visibility === "school"
                    ? `Nur Lehrpersonen von «${img.owner_institution}» können dieses Bild ansehen und kopieren.`
                    : "Nur du siehst dieses Bild."}
                </p>
                <form action={visibilityImageAction} className="row">
                  <input type="hidden" name="id" value={img.id} />
                  <button name="v" value="private" className={`btn small ${visibility === "private" ? "" : "ghost"}`}>Nur ich</button>
                  {img.owner_institution && <button name="v" value="school" className={`btn small ${visibility === "school" ? "" : "ghost"}`}>Meine Schule</button>}
                  <button name="v" value="all" className={`btn small ${visibility === "all" ? "" : "ghost"}`}>Alle (Pool)</button>
                </form>
                {isAdmin && (
                  <>
                    <h3 style={{ margin: "1.2rem 0 .4rem" }}>Öffentliche Bilder-Seite</h3>
                    <p className="small-note">
                      {img.beispiel
                        ? "Dieses Bild steht als Beispiel auf lernwege.edutecsol.ch/bild-beispiele.html (Abschnitt «Aus dem Mitgliederbereich») und ist damit ohne Login sichtbar."
                        : "Als Beispiel auf die öffentliche Bilder-Seite stellen: Bild, Rezept, Prompt und Arbeitsauftrag werden dort ohne Login gezeigt (Admin)."}
                    </p>
                    <form action={exampleImageAction}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="on" value={img.beispiel ? "0" : "1"} />
                      <button className={`btn small ${img.beispiel ? "ghost" : ""}`} style={img.beispiel ? { color: "var(--err)" } : undefined}>{img.beispiel ? "Von der Bilder-Seite nehmen" : "Als öffentliches Beispiel zeigen"}</button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>

          <details className="card" style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Bildprompt und Bilder-Rezept</summary>
            <div style={{ marginTop: ".8rem" }}>
              <pre className="prompt-box">{img.prompt}</pre>
              <div style={{ marginTop: ".6rem" }}><CopyText text={img.prompt} label="Prompt kopieren" /></div>
              {img.instruction && (
                <p className="small-note" style={{ marginTop: ".8rem" }}><b>Änderungsauftrag dieser Variante:</b> {img.instruction}</p>
              )}
              <h3 style={{ margin: "1.2rem 0 .4rem" }}>Mein Bilder-Rezept</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: ".92rem" }}>
                {recipe.map(([a, b]) => (
                  <li key={a} style={{ padding: ".45rem .7rem", border: "1px solid var(--line)", borderRadius: 9, marginBottom: ".4rem", background: "#fff" }}>
                    <b style={{ color: "var(--terra)" }}>{a}</b> {b || <i className="small-note">… (nicht ausgefüllt)</i>}
                  </li>
                ))}
              </ul>
              <table style={{ marginTop: "1rem" }}>
                <tbody>
                  <tr><th>Dienst</th><td>{img.provider} · {img.model} · {img.quality === "high" ? "hohe Qualität" : "Standard"}</td></tr>
                  <tr><th>Tokens</th><td>{img.input_tokens.toLocaleString("de-CH")} ein / {img.output_tokens.toLocaleString("de-CH")} aus{img.duration_ms ? ` · ${Math.round(img.duration_ms / 1000)} s` : ""}</td></tr>
                  <tr><th>Grösse</th><td>{img.size} · {Math.round(img.bytes / 1024)} KB</td></tr>
                  {img.copied_from && <tr><th>Kopie</th><td>aus freigegebenem Bild #{img.copied_from}</td></tr>}
                </tbody>
              </table>
            </div>
          </details>

          {canEdit && (
            <form action={deleteImageAction} style={{ marginTop: "1rem" }}>
              <input type="hidden" name="id" value={img.id} />
              <button className="btn ghost" style={{ color: "var(--err)" }}>Bild löschen</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
