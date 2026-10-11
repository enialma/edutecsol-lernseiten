import Link from "next/link";
import { auth } from "@/auth";
import { EINSATZ_LABELS, type Einsatz } from "@/lib/bildprompt";
import { listImages, type ImageListMode } from "@/lib/images";
import { getInstitutionOf } from "@/lib/users";
import Topbar from "../../Topbar";

export const dynamic = "force-dynamic";

export default async function BilderPage({ searchParams }: { searchParams: Promise<{ modus?: string }> }) {
  const session = await auth();
  const sp = await searchParams;
  const isAdmin = session?.user?.role === "admin";
  const userId = Number(session!.user.id);
  const institution = await getInstitutionOf(userId);
  const mode: ImageListMode = sp.modus === "schule" && institution ? "school" : sp.modus === "pool" ? "pool" : sp.modus === "alle" && isAdmin ? "all" : "mine";
  const images = await listImages(userId, mode);
  const roots = images.filter((i) => !i.parent_id || !images.some((r) => r.id === i.parent_id));
  const variants = images.filter((i) => i.parent_id);
  const tab = (m: string, label: string) => (
    <Link className={`btn small ${(sp.modus ?? "mine") === m ? "" : "ghost"}`} href={`/app/bilder?modus=${m}`}>{label}</Link>
  );

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>{mode === "school" ? institution : mode === "pool" ? "Gemeinsamer Bilder-Pool" : mode === "all" ? "Alle Bilder" : "Meine Bilder"}</h1>
          <p className="lead">
            {mode === "school"
              ? "Bilder, die Kolleginnen und Kollegen nur für eure Schule freigegeben haben. Öffnen, ansehen, in die eigene Sammlung kopieren."
              : mode === "pool"
              ? "Bilder, die Kolleginnen und Kollegen für alle freigegeben haben. Öffnen, ansehen, in die eigene Sammlung kopieren."
              : "Direkt erzeugte Bilder für Lernaufgaben. Öffnen, nachbessern, herunterladen, in eine Lernseite oder Moodle einbinden."}
          </p>

          <div className="row" style={{ marginBottom: "1rem", alignItems: "center" }}>
            {tab("mine", "Meine")}
            {institution && tab("schule", "Meine Schule")}
            {tab("pool", "Pool")}
            {isAdmin && tab("alle", "Alle Benutzer")}
            <span style={{ flex: 1 }} />
            <Link className="btn terra small" href="/app/bilder/erzeugen">+ Neues Bild</Link>
          </div>

          {images.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0 }}>
                {mode === "mine" ? <>Noch keine Bilder. <Link href="/app/bilder/erzeugen">Erstes Bild erzeugen →</Link></> : "Hier liegen noch keine freigegebenen Bilder."}
              </p>
            </div>
          ) : (
            <div className="imgs">
              {roots.map((i) => {
                const n = variants.filter((v) => v.parent_id === i.id).length;
                return (
                  <Link key={i.id} href={`/app/bilder/${i.id}`}>
                    <img src={`/app/bilder/${i.id}/jpg`} alt={i.title} loading="lazy" />
                    <span className="cap">
                      {i.title}
                      <small>
                        {i.einsatz ? EINSATZ_LABELS[i.einsatz as Einsatz] ?? i.einsatz : "Bild"} · {i.created_at}
                        {n > 0 ? ` · ${n} Variante${n > 1 ? "n" : ""}` : ""}
                        {i.pool ? " · Pool" : i.school ? " · Schule" : ""}
                        {i.beispiel ? " · öffentliches Beispiel" : ""}
                        {mode !== "mine" ? ` · ${i.owner_name || i.owner_email}` : ""}
                      </small>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
