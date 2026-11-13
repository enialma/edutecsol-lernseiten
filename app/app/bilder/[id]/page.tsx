import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { EINSATZ_LABELS, TASKS, encodeState, fixes, labelText, normalize, recipeLines, type Einsatz } from "@/lib/bildprompt";
import { imageProviderReady } from "@/lib/imagegen";
import { getImageMeta, imageFamily } from "@/lib/images";
import { imageQuotaFor } from "@/lib/quota";
import AppShell from "../../../AppShell";
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
  const task = TASKS[einsatz] ?? TASKS.beschreiben;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const shareUrl = img.share_token ? `${origin}/b/${img.share_token}` : null;
  const slug = img.title.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "bild";
  const back = own ? ["/app/bilder", "Bilder"] : img.pool ? ["/app/bilder?modus=pool", "Bilder-Pool"] : img.school ? ["/app/bilder?modus=schule", "Meine Schule"] : ["/app/bilder?modus=alle", "Alle Bilder"];
  const meta = [
    EINSATZ_LABELS[einsatz] ?? einsatz,
    `erzeugt am ${img.created_at}`,
    img.size,
    img.instruction ? "nachgebesserte Variante" : null,
    img.copied_from ? "Kopie" : null,
    !own ? `von ${img.owner_name || img.owner_email}` : null,
  ].filter(Boolean).join(" · ");
  const visOpts: [string, string, string][] = [
    ["private", "Nur ich", "Nur du siehst dieses Bild."],
    ...(img.owner_institution ? [["school", "Meine Schule", `Lehrpersonen von «${img.owner_institution}» können es ansehen und kopieren.`] as [string, string, string]] : []),
    ["all", "Alle (Pool)", "Alle angemeldeten Lehrpersonen können es ansehen und kopieren."],
  ];

  return (
    <AppShell active="bilder">
      <nav className="crumb" aria-label="Brotkrumen"><Link href={back[0]}>{back[1]}</Link> <span aria-hidden="true">/</span> {img.title}</nav>
      <header className="page-head">
        <div>
          <h1>{img.title}</h1>
          <p>{meta}</p>
        </div>
        <div className="head-acts">
          <a className="btn" href={`/app/bilder/${img.id}/jpg?download=1`} download={`${slug}.jpg`}>Bild herunterladen</a>
          <a className="btn ghost" href={`/app/bilder/${img.id}/jpg`} target="_blank" rel="noopener">In neuem Tab öffnen</a>
          {!own && (
            <form action={copyImageAction}>
              <input type="hidden" name="id" value={img.id} />
              <button className="btn terra">In meine Sammlung kopieren</button>
            </form>
          )}
        </div>
      </header>

      <div className="detail">
        <div className="detail-main">
          <section className="box" aria-label="Bild">
            <img className="hero-img" src={`/app/bilder/${img.id}/jpg`} alt={img.title} />
            {family.length > 1 && (
              <div className="variants">
                <p className="mini-label">Varianten</p>
                <ul>
                  {family.map((f, i) => (
                    <li key={f.id}>
                      <Link href={`/app/bilder/${f.id}`} title={f.instruction ?? "Ausgangsbild"} className={f.id === img.id ? "on" : undefined} aria-current={f.id === img.id ? "page" : undefined}>
                        <img src={`/app/bilder/${f.id}/jpg`} alt="" />
                        <span>{i === 0 ? "Ausgangsbild" : `Schritt ${i}`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="row img-acts">
            {canEdit && <Link className="btn ghost" href={`/app/erzeugen?bild=${img.id}`}>In eine Lernseite einbauen</Link>}
            <Link className="btn ghost" href={`/app/bilder/erzeugen?r=${encodeState(state)}`}>Rezept anpassen, neu erzeugen</Link>
          </div>

          {canEdit && (
            <section className="box pad block bbox" aria-labelledby="h-nb">
              <h2 id="h-nb">Nachbessern, eine Sache nach der anderen</h2>
              <EditForm imageId={img.id} suggestions={fixes(state)} canEdit={imageProviderReady("openai")} exhausted={exhausted} />
            </section>
          )}

          <details className="box fold">
            <summary>Bildprompt und Bilder-Rezept</summary>
            <pre className="prompt-box">{img.prompt}</pre>
            <div className="fold-acts"><CopyText text={img.prompt} label="Prompt kopieren" /></div>
            {img.instruction && <p className="box-text soft"><b>Änderungsauftrag dieser Variante:</b> {img.instruction}</p>}
            <h3>Mein Bilder-Rezept</h3>
            <ul className="recipe">
              {recipe.map(([a, b]) => (
                <li key={a}><b>{a}</b> {b || <i className="soft">… (nicht ausgefüllt)</i>}</li>
              ))}
            </ul>
            <dl className="facts-list">
              <dt>Dienst</dt><dd>{img.provider} · {img.model} · {img.quality === "high" ? "hohe Qualität" : "Standard"}</dd>
              <dt>Tokens</dt><dd>{img.input_tokens.toLocaleString("de-CH")} ein / {img.output_tokens.toLocaleString("de-CH")} aus{img.duration_ms ? ` · ${Math.round(img.duration_ms / 1000)} s` : ""}</dd>
              <dt>Grösse</dt><dd>{img.size} · {Math.round(img.bytes / 1024)} KB</dd>
              {img.copied_from && <><dt>Kopie</dt><dd>aus freigegebenem Bild #{img.copied_from}</dd></>}
            </dl>
          </details>
        </div>

        <div className="detail-side">
          {canEdit && (
            <section className="share" aria-labelledby="h-bl">
              <div className="between">
                <h2 id="h-bl">Bildlink</h2>
                <span className="share-state">{shareUrl ? "Aktiv" : "Aus"}</span>
              </div>
              {shareUrl ? (
                <>
                  <div>
                    <label htmlFor="blnk">Bildlink, ohne Konto</label>
                    <input id="blnk" type="text" readOnly value={shareUrl} />
                  </div>
                  <div className="share-acts">
                    <CopyText text={shareUrl} label="Link kopieren" className="btn terra" />
                  </div>
                  <p className="share-note">Wer den Link hat, sieht das Bild ohne Login. Als Bild-URL in Moodle, Teams oder in einer Lernseite verwendbar.</p>
                  {!img.beispiel && (
                    <form action={shareImageAction}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="on" value="0" />
                      <button className="share-off">Freigabe zurückziehen</button>
                    </form>
                  )}
                </>
              ) : (
                <>
                  <p className="share-note">Noch nicht freigegeben. Ein Bildlink macht das Bild ohne Login erreichbar, bis du ihn zurückziehst.</p>
                  <form action={shareImageAction} className="share-acts">
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="on" value="1" />
                    <button className="btn terra">Bildlink erstellen</button>
                  </form>
                </>
              )}
            </section>
          )}

          <section className="box pad block bbox" aria-labelledby="h-un">
            <h2 id="h-un">Für den Unterricht</h2>
            <p className="mini-label">Arbeitsauftrag</p>
            <blockquote className="quote">«{task}»</blockquote>
            <CopyText text={task} label="Arbeitsauftrag kopieren" />
            <p className="mini-label">Kennzeichnung fürs Material</p>
            <blockquote className="quote">{label}</blockquote>
            <CopyText text={label} label="Kennzeichnung kopieren" />
            <p className="mini-label">Nach dem Generieren prüfen</p>
            <ol className="checklist">
              <li><b>Fachlich:</b> Stimmen Gegenstände, Abläufe und Zusammenhänge?</li>
              <li><b>Didaktisch:</b> Können die Lernenden damit die geplante Aufgabe bearbeiten?</li>
              <li><b>Darstellung:</b> Was ist unklar, ablenkend oder stereotyp?</li>
              <li><b>Verwendung:</b> Ist das Bild als KI-generiert und fiktiv gekennzeichnet?</li>
            </ol>
          </section>

          {canEdit && (
            <section className="box pad block bbox" aria-labelledby="h-si">
              <h2 id="h-si">Sichtbarkeit</h2>
              <div className="opts">
                {visOpts.map(([v, t, d]) => (
                  <form key={v} action={visibilityImageAction}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="v" value={v} />
                    <button className={`opt${visibility === v ? " on" : ""}`} aria-pressed={visibility === v}><b>{t}</b><small>{d}</small></button>
                  </form>
                ))}
              </div>
              {isAdmin && (
                <>
                  <p className="mini-label">Öffentliche Bilder-Seite</p>
                  <p className="box-text soft">
                    {img.beispiel
                      ? "Dieses Bild steht als Beispiel auf lernwege.edutecsol.ch/bild-beispiele.html (Abschnitt «Aus dem Mitgliederbereich») und ist damit ohne Login sichtbar."
                      : "Als Beispiel auf die öffentliche Bilder-Seite stellen: Bild, Rezept, Prompt und Arbeitsauftrag werden dort ohne Login gezeigt (Admin)."}
                  </p>
                  <form action={exampleImageAction}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="on" value={img.beispiel ? "0" : "1"} />
                    <button className="btn small ghost">{img.beispiel ? "Von der Bilder-Seite nehmen" : "Als öffentliches Beispiel zeigen"}</button>
                  </form>
                </>
              )}
              <p className="mini-label">Titel</p>
              <form action={renameImageAction} className="row stretch">
                <input type="hidden" name="id" value={img.id} />
                <label htmlFor="btitel" className="sr">Titel des Bildes</label>
                <input id="btitel" name="title" defaultValue={img.title} style={{ flex: "1 1 180px" }} />
                <button className="btn small ghost">Speichern</button>
              </form>
            </section>
          )}
        </div>
      </div>

      {canEdit && (
        <form action={deleteImageAction} className="danger">
          <input type="hidden" name="id" value={img.id} />
          <button className="btn ghost">Bild löschen</button>
        </form>
      )}
    </AppShell>
  );
}
