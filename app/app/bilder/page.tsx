import Link from "next/link";
import { auth } from "@/auth";
import { EINSATZ_LABELS, type Einsatz } from "@/lib/bildprompt";
import { listImages, type ImageListMode } from "@/lib/images";
import { getInstitutionOf } from "@/lib/users";
import AppShell from "../../AppShell";

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
  const cur = sp.modus ?? "mine";
  const tabs: [string, string][] = [["mine", "Meine Bilder"], ...(institution ? [["schule", "Meine Schule"] as [string, string]] : []), ["pool", "Pool"], ...(isAdmin ? [["alle", "Alle Benutzer"] as [string, string]] : [])];

  return (
    <AppShell active="bilder">
      <header className="page-head tight">
        <div>
          <h1>{mode === "school" ? institution : mode === "pool" ? "Gemeinsamer Bilder-Pool" : mode === "all" ? "Alle Bilder" : "Bilder"}</h1>
          <p>
            {mode === "school"
              ? "Bilder, die Kolleginnen und Kollegen nur für eure Schule freigegeben haben. Öffnen, ansehen, in die eigene Sammlung kopieren."
              : mode === "pool"
              ? "Bilder, die Kolleginnen und Kollegen für alle freigegeben haben. Öffnen, ansehen, in die eigene Sammlung kopieren."
              : mode === "all"
              ? "Alle Bilder aller Benutzerinnen und Benutzer."
              : "Direkt erzeugte Bilder für Lernaufgaben. Öffnen, nachbessern, herunterladen, in eine Lernseite oder Moodle einbinden."}
          </p>
        </div>
        <Link className="btn terra cta" href="/app/bilder/erzeugen">Neues Bild erzeugen</Link>
      </header>

      <nav className="ltabs" aria-label="Bereich">
        {tabs.map(([m, label]) => (
          <Link key={m} href={`/app/bilder?modus=${m}`} className={cur === m ? "on" : undefined} aria-current={cur === m ? "page" : undefined}>{label}</Link>
        ))}
      </nav>

      {images.length === 0 ? (
        <section className="box">
          <p className="box-empty">
            {mode === "mine" ? <>Noch keine Bilder. <Link className="more" href="/app/bilder/erzeugen">Erzeuge dein erstes.</Link></> : "Hier liegen noch keine freigegebenen Bilder."}
          </p>
        </section>
      ) : (
        <ul className="imgs">
          {roots.map((i) => {
            const n = variants.filter((v) => v.parent_id === i.id).length;
            const meta = [
              i.einsatz ? EINSATZ_LABELS[i.einsatz as Einsatz] ?? i.einsatz : "Bild",
              i.created_at,
              n > 0 ? `${n} Variante${n > 1 ? "n" : ""}` : null,
              mode !== "mine" ? i.owner_name || i.owner_email : null,
            ].filter(Boolean).join(" · ");
            return (
              <li key={i.id}>
                <Link href={`/app/bilder/${i.id}`}>
                  <img src={`/app/bilder/${i.id}/jpg`} alt="" loading="lazy" />
                  <span className="cap">
                    <b>{i.title}</b>
                    <small>{meta}</small>
                    {(i.pool || i.school || i.beispiel) && (
                      <span className="tags">
                        {i.pool ? <span className="tag pool">Im Pool</span> : i.school ? <span className="tag pool">Meine Schule</span> : null}
                        {i.beispiel && <span className="tag frei">Öffentliches Beispiel</span>}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
