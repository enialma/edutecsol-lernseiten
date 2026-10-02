import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPage } from "@/lib/pages";
import { DIFFART_LABELS, NIVEAU_LABELS, SPRACHE_LABELS, TWIST_LABELS, type GenParams } from "@/lib/prompt";
import Topbar from "../../../Topbar";
import { deletePageAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SeitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const page = await getPage(Number(id), Number(session!.user.id), session!.user.role === "admin");
  if (!page) notFound();
  const p = page.params as Partial<GenParams>;
  const slug = page.title.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "lernseite";
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker"><Link href="/app/seiten">← Meine Sammlung</Link></p>
          <h1>{page.title}</h1>
          <p className="lead">
            {page.fach}{page.stufe ? ` · ${page.stufe}` : ""} · erzeugt am {page.created_at}
            {page.material_name ? ` aus «${page.material_name}»` : ""}
          </p>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <a className="btn terra" href={`/app/seiten/${page.id}/html`} target="_blank" rel="noopener">In neuem Tab öffnen</a>
            <a className="btn" href={`/app/seiten/${page.id}/html?download=1`} download={`${slug}.html`}>HTML herunterladen</a>
            <form action={deletePageAction}>
              <input type="hidden" name="id" value={page.id} />
              <button className="btn ghost" style={{ color: "var(--err)" }}>Löschen</button>
            </form>
          </div>

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
                <tr><th>Modell</th><td>{page.provider} · {page.model}</td></tr>
                <tr><th>Tokens</th><td>{page.input_tokens.toLocaleString("de-CH")} ein / {page.output_tokens.toLocaleString("de-CH")} aus{page.duration_ms ? ` · ${Math.round(page.duration_ms / 1000)} s` : ""}</td></tr>
                <tr><th>Grösse</th><td>{Math.round(page.html_bytes / 1024)} KB</td></tr>
                {page.notiz && <tr><th>Notiz der KI</th><td>{page.notiz}</td></tr>}
              </tbody>
            </table>
          </details>
        </div>
      </main>
    </>
  );
}
