import Link from "next/link";
import { auth } from "@/auth";
import { filterValues, listPages, type ListMode } from "@/lib/pages";
import { getInstitutionOf } from "@/lib/users";
import { BEISPIELE, missingBeispiele } from "@/lib/beispiele";
import { gruppenOfPages, listGruppen, type GruppeRef } from "@/lib/gruppen";
import Topbar from "../../Topbar";
import Footer from "../../Footer";
import { importBeispieleAction } from "./actions";

export const dynamic = "force-dynamic";

type SP = { modus?: string; fach?: string; stufe?: string; q?: string; gruppe?: string };

export default async function SeitenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const sp = await searchParams;
  const isAdmin = session?.user?.role === "admin";
  const userId = Number(session!.user.id);
  const institution = await getInstitutionOf(userId);
  const mode: ListMode = sp.modus === "schule" && institution ? "school" : sp.modus === "pool" ? "pool" : sp.modus === "alle" && isAdmin ? "all" : "mine";
  // Gruppenfilter nur in der eigenen Sammlung: eine Gruppe oder «ohne Gruppe»
  const gruppeId = mode === "mine" && sp.gruppe && sp.gruppe !== "ohne" && /^\d+$/.test(sp.gruppe) ? Number(sp.gruppe) : undefined;
  const ohneGruppe = mode === "mine" && sp.gruppe === "ohne";
  const filter = { fach: sp.fach || undefined, stufe: sp.stufe || undefined, q: sp.q?.trim() || undefined, gruppe: gruppeId, ohneGruppe };
  const [pages, values, gruppen] = await Promise.all([listPages(userId, mode, filter), filterValues(userId, mode), mode === "mine" ? listGruppen(userId) : Promise.resolve([])]);
  const pageGruppen: Map<number, GruppeRef[]> = mode === "mine" ? await gruppenOfPages(pages.map((p) => p.id)) : new Map();
  const aktiveGruppe = gruppeId ? gruppen.find((g) => g.id === gruppeId) : undefined;
  const missing = isAdmin && mode === "pool" ? (await missingBeispiele()).length : 0;
  const hasFilter = !!(filter.fach || filter.stufe || filter.q || gruppeId || ohneGruppe);
  const tab = (m: string, label: string) => (
    <Link className={`btn small ${(sp.modus ?? "mine") === m ? "" : "ghost"}`} href={`/app/seiten?modus=${m}`}>{label}</Link>
  );

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>{mode === "school" ? institution : mode === "pool" ? "Gemeinsamer Pool" : mode === "all" ? "Alle Lernseiten" : "Meine Sammlung"}</h1>
          <p className="lead">
            {mode === "school"
              ? "Lernseiten, die Kolleginnen und Kollegen nur für eure Schule freigegeben haben. Öffnen, ansehen, in die eigene Sammlung kopieren."
              : mode === "pool"
              ? "Lernseiten, die Kolleginnen und Kollegen für alle freigegeben haben. Öffnen, ansehen, in die eigene Sammlung kopieren."
              : "Alle erzeugten Lernseiten. Öffnen, herunterladen, per Link oder QR-Code an Lernende geben."}
          </p>

          <div className="row" style={{ marginBottom: "1rem", alignItems: "center" }}>
            {tab("mine", "Meine")}
            {institution && tab("schule", "Meine Schule")}
            {tab("pool", "Pool")}
            {isAdmin && tab("alle", "Alle Benutzer")}
            <span style={{ flex: 1 }} />
            {mode === "mine" && <Link className="btn small ghost" href="/app/gruppen">Klassen und Gruppen</Link>}
            <Link className="btn terra small" href="/app/erzeugen">+ Neue Lernseite</Link>
          </div>

          <form method="get" className="card" style={{ padding: ".8rem 1rem", marginBottom: "1rem" }}>
            <input type="hidden" name="modus" value={sp.modus ?? "mine"} />
            <div className="row" style={{ alignItems: "flex-end" }}>
              {mode === "mine" && gruppen.length > 0 && (
                <div style={{ flex: "1 1 180px" }}>
                  <label style={{ margin: "0 0 .2rem" }}>Klasse / Gruppe</label>
                  <select name="gruppe" defaultValue={ohneGruppe ? "ohne" : gruppeId ? String(gruppeId) : ""}>
                    <option value="">alle</option>
                    <option value="ohne">ohne Gruppe</option>
                    {gruppen.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.seiten})</option>)}
                  </select>
                </div>
              )}
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ margin: "0 0 .2rem" }}>Fach</label>
                <select name="fach" defaultValue={filter.fach ?? ""}>
                  <option value="">alle</option>
                  {values.fach.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ margin: "0 0 .2rem" }}>Stufe</label>
                <select name="stufe" defaultValue={filter.stufe ?? ""}>
                  <option value="">alle</option>
                  {values.stufe.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ flex: "2 1 200px" }}>
                <label style={{ margin: "0 0 .2rem" }}>Suche</label>
                <input name="q" defaultValue={filter.q ?? ""} placeholder="Titel oder Thema" />
              </div>
              <button className="btn small">Filtern</button>
              {hasFilter && <Link className="btn small ghost" href={`/app/seiten?modus=${sp.modus ?? "mine"}`}>Zurücksetzen</Link>}
            </div>
          </form>

          {missing > 0 && (
            <form action={importBeispieleAction} className="card row" style={{ padding: ".8rem 1rem", marginBottom: "1rem", alignItems: "center" }}>
              <span style={{ flex: "1 1 240px" }}>{missing} der {BEISPIELE.length} Beispielseiten von der Startseite fehlen noch im Pool.</span>
              <button className="btn small">Beispielseiten übernehmen</button>
            </form>
          )}

          {aktiveGruppe && (
            <p className="small-note" style={{ margin: "-.4rem 0 1rem" }}>
              Gruppe «{aktiveGruppe.name}»: {aktiveGruppe.seiten} Seiten, {aktiveGruppe.freigegeben} davon mit Freigabelink. <Link href={`/app/gruppen/${aktiveGruppe.id}`}>Gruppe verwalten</Link>
            </p>
          )}

          {pages.length === 0 ? (
            <div className="card">
              {mode === "school" ? "Für eure Schule ist noch keine Lernseite freigegeben." : mode === "pool" ? "Im Pool liegt noch keine Lernseite." : hasFilter ? "Keine Treffer." : <>Noch keine Lernseite. <Link href="/app/erzeugen">Jetzt die erste erzeugen.</Link></>}
            </div>
          ) : (
            <div className="grid">
              {pages.map((p) => (
                <Link className="tile" href={`/app/seiten/${p.id}`} key={p.id}>
                  <span className="row" style={{ gap: ".3rem" }}>
                    <span className="badge">{p.fach}{p.stufe ? ` · ${p.stufe}` : ""}</span>
                    {(p.params as { typ?: string })?.typ === "pruefung" && <span className="badge" style={{ background: "var(--cream)", color: "var(--terra)" }}>Prüfungsvorbereitung</span>}
                    {(p.params as { typ?: string })?.typ === "spiel" && <span className="badge" style={{ background: "var(--cream)", color: "var(--terra)" }}>Lernspiel</span>}
                    {(p.params as { typ?: string })?.typ === "hilfe" && <span className="badge" style={{ background: "var(--cream)", color: "var(--terra)" }}>Lernhilfe</span>}
                    {(p.params as { typ?: string })?.typ === "arbeitsblatt" && <span className="badge" style={{ background: "var(--cream)", color: "var(--terra)" }}>Arbeitsblatt</span>}
                    {p.share_token && <span className="badge ok">Link</span>}
                    {p.school && <span className="badge new">Schule</span>}
                    {p.pool && <span className="badge new">Pool</span>}
                    {pageGruppen.get(p.id)?.map((g) => <span key={g.id} className="badge gruppe">{g.name}</span>)}
                  </span>
                  <h3>{p.title}</h3>
                  <p>
                    {p.created_at} · {p.provider === "claude" ? "Claude" : p.provider === "openai" ? "ChatGPT" : p.provider === "beispiel" ? "Beispielseite" : "Infomaniak"}
                    {mode !== "mine" ? ` · ${p.owner_name || p.owner_email}` : ""}
                  </p>
                  <span className="foot">Öffnen →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
