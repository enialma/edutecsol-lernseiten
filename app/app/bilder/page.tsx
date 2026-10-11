import Link from "next/link";
import { auth } from "@/auth";
import { EINSATZ_LABELS, type Einsatz } from "@/lib/bildprompt";
import { listImages } from "@/lib/images";
import Topbar from "../../Topbar";

export const dynamic = "force-dynamic";

export default async function BilderPage({ searchParams }: { searchParams: Promise<{ alle?: string }> }) {
  const session = await auth();
  const sp = await searchParams;
  const isAdmin = session?.user?.role === "admin";
  const all = isAdmin && sp.alle === "1";
  const images = await listImages(Number(session!.user.id), all);
  const roots = images.filter((i) => !i.parent_id);
  const variants = images.filter((i) => i.parent_id);

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>{all ? "Alle Bilder" : "Meine Bilder"}</h1>
          <p className="lead">Direkt erzeugte Bilder für Lernaufgaben. Öffnen, nachbessern, herunterladen, per Link in Moodle oder eine Lernseite einbinden.</p>

          <div className="row" style={{ marginBottom: "1rem", alignItems: "center" }}>
            {isAdmin && <Link className={`btn small ${all ? "ghost" : ""}`} href="/app/bilder">Meine</Link>}
            {isAdmin && <Link className={`btn small ${all ? "" : "ghost"}`} href="/app/bilder?alle=1">Alle Benutzer</Link>}
            <span style={{ flex: 1 }} />
            <Link className="btn terra small" href="/app/bilder/erzeugen">+ Neues Bild</Link>
          </div>

          {images.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0 }}>Noch keine Bilder. <Link href="/app/bilder/erzeugen">Erstes Bild erzeugen →</Link></p>
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
                        {all ? ` · ${i.owner_name || i.owner_email}` : ""}
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
