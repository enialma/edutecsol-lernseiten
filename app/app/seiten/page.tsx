import Link from "next/link";
import { auth } from "@/auth";
import { filterValues, listPages, type ListMode } from "@/lib/pages";
import { getInstitutionOf } from "@/lib/users";
import { BEISPIELE, missingBeispiele } from "@/lib/beispiele";
import { gruppenOfPages, listGruppen, type GruppeRef } from "@/lib/gruppen";
import { coachAllowedFor } from "@/lib/coach";
import { normalizeLernseite, type GenParams } from "@/lib/prompt";
import AppShell from "../../AppShell";
import { copyAction, importBeispieleAction } from "./actions";

export const dynamic = "force-dynamic";

type SP = { modus?: string; fach?: string; stufe?: string; q?: string; gruppe?: string; typ?: string };

const TYPEN: [string, string][] = [["lernseite", "Lernseite"], ["arbeitsblatt", "Arbeitsblatt"], ["pruefung", "Prüfungsvorbereitung"], ["spiel", "Lernspiel"], ["hilfe", "Lernhilfe"]];
const typOf = (params: unknown) => (params as { typ?: string })?.typ ?? "lernseite";

export default async function SeitenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const sp = await searchParams;
  const isAdmin = session?.user?.role === "admin";
  const userId = Number(session!.user.id);
  const institution = await getInstitutionOf(userId);
  const mode: ListMode = sp.modus === "schule" && institution ? "school" : sp.modus === "pool" ? "pool" : sp.modus === "alle" && isAdmin ? "all" : "mine";
  const modus = mode === "school" ? "schule" : mode === "pool" ? "pool" : mode === "all" ? "alle" : "mine";
  // Gruppenfilter nur in der eigenen Sammlung: eine Gruppe oder «ohne Gruppe»
  const gruppeId = mode === "mine" && sp.gruppe && sp.gruppe !== "ohne" && /^\d+$/.test(sp.gruppe) ? Number(sp.gruppe) : undefined;
  const ohneGruppe = mode === "mine" && sp.gruppe === "ohne";
  const filter = { fach: sp.fach || undefined, stufe: sp.stufe || undefined, q: sp.q?.trim() || undefined, gruppe: gruppeId, ohneGruppe };
  const [alle, values, gruppen] = await Promise.all([listPages(userId, mode, filter), filterValues(userId, mode), mode === "mine" ? listGruppen(userId) : Promise.resolve([])]);
  // Typ-Filter (Chips) auf der bereits gefilterten Liste; die Zahlen auf den Chips zählen dieselbe Liste
  const typ = TYPEN.some(([v]) => v === sp.typ) ? sp.typ! : "";
  const pages = typ ? alle.filter((p) => typOf(p.params) === typ) : alle;
  const pageGruppen: Map<number, GruppeRef[]> = mode === "mine" ? await gruppenOfPages(pages.map((p) => p.id)) : new Map();
  const aktiveGruppe = gruppeId ? gruppen.find((g) => g.id === gruppeId) : undefined;
  const missing = isAdmin && mode === "pool" ? (await missingBeispiele()).length : 0;
  const hasFilter = !!(filter.fach || filter.stufe || filter.q || gruppeId || ohneGruppe);

  /** Adresse der Sammlung mit den aktuellen Filtern; einzelne Werte lassen sich überschreiben. */
  const href = (over: Partial<Record<keyof SP, string>>) => {
    const cur: Record<string, string | undefined> = { modus, typ, fach: filter.fach, stufe: filter.stufe, q: filter.q, gruppe: ohneGruppe ? "ohne" : gruppeId ? String(gruppeId) : undefined, ...over };
    const qs = Object.entries(cur).filter(([k, v]) => v && !(k === "modus" && v === "mine")).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
    return `/app/seiten${qs ? `?${qs}` : ""}`;
  };
  const tabs: [string, string][] = [["mine", "Meine Seiten"], ...(institution ? [["schule", "Meine Schule"] as [string, string]] : []), ["pool", "Pool"], ...(isAdmin ? [["alle", "Alle Benutzer"] as [string, string]] : [])];

  return (
    <AppShell active="sammlung">
      <header className="page-head tight">
        <div>
          <h1>{mode === "school" ? institution : mode === "pool" ? "Gemeinsamer Pool" : mode === "all" ? "Alle Lernseiten" : "Sammlung"}</h1>
          <p>
            {mode === "school"
              ? "Seiten, die Kolleginnen und Kollegen nur für eure Schule freigegeben haben. Ansehen und in die eigene Sammlung kopieren."
              : mode === "pool"
              ? "Seiten, die Kolleginnen und Kollegen für alle freigegeben haben. Ansehen und in die eigene Sammlung kopieren."
              : mode === "all"
              ? "Alle Seiten aller Benutzerinnen und Benutzer."
              : "Deine erzeugten Seiten. Öffnen, herunterladen, per Link oder QR-Code an Lernende geben."}
          </p>
        </div>
        <Link className="btn terra cta" href="/app/erzeugen">Neue Seite erzeugen</Link>
      </header>

      <nav className="ltabs" aria-label="Bereich">
        {tabs.map(([m, label]) => (
          <Link key={m} href={m === "mine" ? "/app/seiten" : `/app/seiten?modus=${m}`} className={modus === m ? "on" : undefined} aria-current={modus === m ? "page" : undefined}>{label}</Link>
        ))}
        {mode === "mine" && <Link className="ltabs-side" href="/app/gruppen">Klassen und Gruppen</Link>}
      </nav>

      <form method="get" className="lfilter" role="search" aria-label="Sammlung filtern">
        {modus !== "mine" && <input type="hidden" name="modus" value={modus} />}
        {typ && <input type="hidden" name="typ" value={typ} />}
        <div className="grow">
          <label htmlFor="f-q">Suche</label>
          <input id="f-q" type="search" name="q" defaultValue={filter.q ?? ""} placeholder="Titel oder Thema" />
        </div>
        {mode === "mine" && gruppen.length > 0 && (
          <div>
            <label htmlFor="f-gruppe">Klasse / Gruppe</label>
            <select id="f-gruppe" name="gruppe" defaultValue={ohneGruppe ? "ohne" : gruppeId ? String(gruppeId) : ""}>
              <option value="">alle</option>
              <option value="ohne">ohne Gruppe</option>
              {gruppen.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.seiten})</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="f-fach">Fach</label>
          <select id="f-fach" name="fach" defaultValue={filter.fach ?? ""}>
            <option value="">alle</option>
            {values.fach.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-stufe">Stufe</label>
          <select id="f-stufe" name="stufe" defaultValue={filter.stufe ?? ""}>
            <option value="">alle</option>
            {values.stufe.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button className="btn">Filtern</button>
        {hasFilter && <Link className="btn ghost" href={href({ fach: "", stufe: "", q: "", gruppe: "" })}>Zurücksetzen</Link>}
      </form>

      <div className="chips" role="group" aria-label="Nach Typ filtern">
        <Link href={href({ typ: "" })} className={typ ? undefined : "on"} aria-current={typ ? undefined : "true"}>Alle <span>{alle.length}</span></Link>
        {TYPEN.map(([v, label]) => (
          <Link key={v} href={href({ typ: v })} className={typ === v ? "on" : undefined} aria-current={typ === v ? "true" : undefined}>
            {label} <span>{alle.filter((p) => typOf(p.params) === v).length}</span>
          </Link>
        ))}
      </div>

      {missing > 0 && (
        <form action={importBeispieleAction} className="box pad row-between" style={{ marginBottom: "1rem" }}>
          <span>{missing} der {BEISPIELE.length} Beispielseiten von der Startseite fehlen noch im Pool.</span>
          <button className="btn ghost">Beispielseiten übernehmen</button>
        </form>
      )}

      {aktiveGruppe && (
        <p className="small-note" style={{ margin: "0 0 1rem" }}>
          Gruppe «{aktiveGruppe.name}»: {aktiveGruppe.seiten} Seiten, {aktiveGruppe.freigegeben} davon mit Freigabelink. <Link href={`/app/gruppen/${aktiveGruppe.id}`}>Gruppe verwalten</Link>
        </p>
      )}

      <section className="box" aria-label="Seiten">
        {pages.length === 0 ? (
          <p className="box-empty">
            {typ
              ? "Noch keine Seite dieses Typs. Erzeuge eine neue oder wechsle den Filter."
              : mode === "school" ? "Für eure Schule ist noch keine Seite freigegeben." : mode === "pool" ? "Im Pool liegt noch keine Seite." : hasFilter ? "Keine Treffer." : <>Noch keine Seite. <Link className="more" href="/app/erzeugen">Erzeuge deine erste.</Link></>}
          </p>
        ) : (
          <div className="ltable-wrap">
            <table className="ltable">
              <thead>
                <tr><th scope="col">Titel</th><th scope="col">Typ</th><th scope="col">Zugänge</th><th scope="col">Coach</th><th scope="col">Status</th><th scope="col">Erzeugt</th><th scope="col" className="r">Aktionen</th></tr>
              </thead>
              <tbody>
                {pages.map((p) => {
                  const t = typOf(p.params);
                  const own = p.user_id === userId;
                  const zug = t === "lernseite" || t === "arbeitsblatt"
                    ? normalizeLernseite(p.params as Partial<GenParams>).zugaenge.map((_, i) => String.fromCharCode(65 + i)).join(", ")
                    : t === "spiel" ? "4 Levels" : "–";
                  const sub = [p.fach, p.stufe, mode !== "mine" ? (p.owner_name || p.owner_email) : null].filter(Boolean).join(" · ");
                  return (
                    <tr key={p.id}>
                      <th scope="row">
                        <Link className="ltitle" href={`/app/seiten/${p.id}`}><b>{p.title}</b>{sub && <small>{sub}</small>}</Link>
                        {pageGruppen.get(p.id)?.map((g) => <span key={g.id} className="tag pool">{g.name}</span>)}
                      </th>
                      <td>{TYPEN.find(([v]) => v === t)?.[1] ?? "Lernseite"}</td>
                      <td className="soft">{zug}</td>
                      <td className="soft">{coachAllowedFor(p) ? (p.coach ? "An" : "Aus") : "–"}</td>
                      <td>
                        <span className="tags">
                          {p.share_token && <span className="tag frei">Freigegeben</span>}
                          {p.pool && <span className="tag pool">Im Pool</span>}
                          {p.school && !p.pool && <span className="tag pool">Meine Schule</span>}
                          {!p.share_token && !p.pool && !p.school && <span className="tag priv">Privat</span>}
                        </span>
                      </td>
                      <td className="soft nowrap">{p.created_at.slice(0, 10)}</td>
                      <td className="r">
                        <span className="lacts">
                          <Link className="btn small ghost" href={`/app/seiten/${p.id}`} aria-label={`«${p.title}» öffnen`}>{own ? "Öffnen" : "Ansehen"}</Link>
                          {!own && (
                            <form action={copyAction}>
                              <input type="hidden" name="id" value={p.id} />
                              <button className="btn small ghost" aria-label={`«${p.title}» in meine Sammlung kopieren`}>Kopieren</button>
                            </form>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
