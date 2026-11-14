import Link from "next/link";
import { LIMIT_BILDER, LIMITS, usageByUser } from "@/lib/quota";
import { listInstitutions, listUsers } from "@/lib/users";
import AppShell from "../../AppShell";
import {
  createInstitutionAction, createUserAction, deleteInstitutionAction, deleteUserAction, renameInstitutionAction,
  setInstitutionAction, setPasswordAction, swissOnlyAction, toggleActiveAction, toggleCoachAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Bereich = "zugaenge" | "institutionen" | "nutzung";

export default async function BenutzerPage({ searchParams }: { searchParams: Promise<{ bereich?: string }> }) {
  const sp = await searchParams;
  const bereich: Bereich = sp.bereich === "institutionen" || sp.bereich === "nutzung" ? sp.bereich : "zugaenge";
  const [users, usage, institutions] = await Promise.all([listUsers(), usageByUser(), listInstitutions()]);
  const total = usage.reduce((t, u) => ({ pages: t.pages + u.pages, input_tokens: t.input_tokens + u.input_tokens, output_tokens: t.output_tokens + u.output_tokens }), { pages: 0, input_tokens: 0, output_tokens: 0 });
  const nf = (n: number) => n.toLocaleString("de-CH");
  const tabs: [Bereich, string][] = [["zugaenge", `Zugänge (${users.length})`], ["institutionen", `Institutionen (${institutions.length})`], ["nutzung", "Nutzung"]];

  return (
    <AppShell active="benutzer">
      <header className="page-head tight">
        <div>
          <h1>Benutzer</h1>
          <p>
            Nur hier eingetragene und aktive E-Mail-Adressen können sich anmelden, mit Microsoft 365 oder, wenn ein
            Passwort gesetzt ist, mit Passwort.
          </p>
        </div>
      </header>

      <nav className="ltabs" aria-label="Bereich">
        {tabs.map(([b, label]) => (
          <Link key={b} href={`/admin/benutzer?bereich=${b}`} className={bereich === b ? "on" : undefined} aria-current={bereich === b ? "page" : undefined}>{label}</Link>
        ))}
      </nav>

      {bereich === "zugaenge" && (
        <>
          <form action={createUserAction} className="adm-new">
            <fieldset className="fs">
              <legend>Neuen Zugang anlegen</legend>
              <div className="form-grid">
                <div><label htmlFor="u-email">E-Mail *</label><input id="u-email" name="email" type="email" required /></div>
                <div><label htmlFor="u-name">Name</label><input id="u-name" name="name" /></div>
                <div>
                  <label htmlFor="u-inst">Institution</label>
                  <select id="u-inst" name="institution_id" defaultValue="">
                    <option value="">keine</option>
                    {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div><label htmlFor="u-bis">Gültig bis (optional)</label><input id="u-bis" name="valid_until" type="date" /></div>
                <div>
                  <label htmlFor="u-rolle">Rolle</label>
                  <select id="u-rolle" name="role" defaultValue="user">
                    <option value="user">Lehrperson</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div><label htmlFor="u-pw">Passwort (leer = nur Microsoft-Login)</label><input id="u-pw" name="password" type="text" autoComplete="off" minLength={8} /></div>
              </div>
              <label htmlFor="u-notiz">Notiz</label>
              <input id="u-notiz" name="notes" />
              <div className="form-acts"><button className="btn terra">Zugang anlegen</button></div>
            </fieldset>
          </form>

          <section className="box" aria-labelledby="h-zu">
            <div className="box-head">
              <h2 id="h-zu">Alle Zugänge</h2>
              <span className="soft-count">{users.length === 1 ? "1 Konto" : `${users.length} Konten`}</span>
            </div>
            {users.length === 0 ? (
              <p className="box-empty">Noch keine Benutzer. Admins aus ADMIN_EMAILS werden beim ersten Login automatisch angelegt.</p>
            ) : (
              <div className="ltable-wrap">
                <table className="ltable adm">
                  <thead>
                    <tr><th scope="col">Konto</th><th scope="col">Institution</th><th scope="col">Rolle und Status</th><th scope="col">Login</th><th scope="col">Passwort</th><th scope="col" className="r">Aktionen</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <th scope="row">
                          <span className="ltitle">
                            <b>{u.name || u.email}</b>
                            {u.name && <small>{u.email}</small>}
                            {u.notes && <small>{u.notes}</small>}
                          </span>
                        </th>
                        <td>
                          <form action={setInstitutionAction} className="inl">
                            <input type="hidden" name="id" value={u.id} />
                            <label htmlFor={`inst-${u.id}`} className="sr">Institution von {u.email}</label>
                            <select id={`inst-${u.id}`} name="institution_id" defaultValue={u.institution_id ?? ""}>
                              <option value="">keine</option>
                              {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                            <button className="btn small ghost">Setzen</button>
                          </form>
                        </td>
                        <td>
                          <span className="tags">
                            <span className="tag pool">{u.role === "admin" ? "Admin" : "Lehrperson"}</span>
                            <span className={`tag ${u.active ? "frei" : "priv"}`}>{u.active ? "Aktiv" : u.pending ? "Zahlung offen" : "Gesperrt"}</span>
                          </span>
                          {(u.has_subscription || u.valid_until) && (
                            <small className="cell-note">{[u.has_subscription ? "Abo (Payrexx)" : null, u.valid_until ? `bis ${u.valid_until}` : null].filter(Boolean).join(" · ")}</small>
                          )}
                          <form action={toggleCoachAction} className="inl">
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="coach" value={u.coach ? "0" : "1"} />
                            <button className="btn small ghost" title="Zusatzoption KI-Lerncoach" aria-pressed={u.coach}>{u.coach ? "Coach: an" : "Coach: aus"}</button>
                          </form>
                        </td>
                        <td className="soft">
                          {u.has_password ? "M365 + Passwort" : "M365"}
                          <small className="cell-note">Zuletzt {u.last_login_at ?? "–"}{u.last_login_via ? ` · ${u.last_login_via}` : ""}</small>
                        </td>
                        <td>
                          <form action={setPasswordAction} className="inl">
                            <input type="hidden" name="id" value={u.id} />
                            <label htmlFor={`pw-${u.id}`} className="sr">Neues Passwort für {u.email}</label>
                            <input id={`pw-${u.id}`} name="password" placeholder="neues Passwort" minLength={8} autoComplete="off" />
                            <button className="btn small ghost">Setzen</button>
                          </form>
                        </td>
                        <td className="r">
                          <span className="lacts">
                            <form action={toggleActiveAction}>
                              <input type="hidden" name="id" value={u.id} />
                              <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                              <button className="btn small ghost">{u.active ? "Sperren" : "Aktivieren"}</button>
                            </form>
                            <form action={deleteUserAction}>
                              <input type="hidden" name="id" value={u.id} />
                              <button className="btn small ghost del" aria-label={`${u.email} löschen`}>Löschen</button>
                            </form>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {bereich === "institutionen" && (
        <div className="cols top">
          <section className="box wide" aria-labelledby="h-in">
            <div className="box-head">
              <h2 id="h-in">Institutionen</h2>
              <span className="soft-count">{institutions.length === 1 ? "1 Institution" : `${institutions.length} Institutionen`}</span>
            </div>
            {institutions.length === 0 ? (
              <p className="box-empty">Noch keine Institution angelegt.</p>
            ) : (
              <div className="ltable-wrap">
                <table className="ltable compact">
                  <thead><tr><th scope="col">Name</th><th scope="col">Konten</th><th scope="col">KI nur Schweiz</th><th scope="col" className="r">Aktion</th></tr></thead>
                  <tbody>
                    {institutions.map((i) => (
                      <tr key={i.id}>
                        <th scope="row">
                          <form action={renameInstitutionAction} className="inl grow">
                            <input type="hidden" name="id" value={i.id} />
                            <label htmlFor={`in-${i.id}`} className="sr">Name der Institution</label>
                            <input id={`in-${i.id}`} name="name" defaultValue={i.name} />
                            <button className="btn small ghost">Umbenennen</button>
                          </form>
                        </th>
                        <td>{i.users}</td>
                        <td>
                          <form action={swissOnlyAction}>
                            <input type="hidden" name="id" value={i.id} />
                            <input type="hidden" name="on" value={i.swiss_only ? "0" : "1"} />
                            <button className="switch" role="switch" aria-checked={i.swiss_only} aria-label={`KI nur Schweiz für ${i.name}`}><span><i /></span></button>
                          </form>
                        </td>
                        <td className="r">
                          <form action={deleteInstitutionAction}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="btn small ghost del" aria-label={`${i.name} löschen`}>Löschen</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="narrow">
            <form action={createInstitutionAction} className="box pad block newg" aria-labelledby="h-ni">
              <h2 id="h-ni">Neue Institution</h2>
              <div>
                <label htmlFor="ni-name">Name</label>
                <input id="ni-name" name="name" required />
              </div>
              <button className="btn terra">Institution anlegen</button>
              <p className="box-text soft">
                Lehrpersonen derselben Institution können Lernseiten nur untereinander freigeben («Meine Schule»). Wird eine
                Institution gelöscht, bleiben die Konten bestehen; für die Schule freigegebene Seiten sieht dann nur noch die Autorin.
              </p>
              <p className="box-text soft">
                <b>KI nur Schweiz:</b> Konten dieser Institution erzeugen Lernseiten, Bilder und Coach-Antworten nur mit Infomaniak
                (Standort Schweiz). Claude, ChatGPT und das Nachbessern von Bildern (OpenAI) sind dann ausgeblendet und serverseitig gesperrt.
              </p>
            </form>
          </div>
        </div>
      )}

      {bereich === "nutzung" && (
        <section className="box" aria-labelledby="h-nu">
          <div className="box-head">
            <h2 id="h-nu">Nutzung</h2>
            <span className="soft-count">{total.pages} Seiten</span>
          </div>
          <p className="box-note">
            Mit KI erzeugte Lernseiten pro Person ({total.pages} Seiten, {nf(total.input_tokens)} Eingabe- und{" "}
            {nf(total.output_tokens)} Ausgabe-Tokens). Gelöschte Seiten zählen weiter mit; die Tokens enthalten auch
            misslungene Versuche. Monatskontingent pro Person: {LIMITS.claude} mit Claude, {LIMITS.openai} mit ChatGPT, {LIMITS.infomaniak} mit
            Infomaniak, {LIMIT_BILDER} Bilder (Admins ohne Limit).
          </p>
          <div className="ltable-wrap">
            <table className="ltable">
              <thead>
                <tr><th scope="col">Konto</th><th scope="col">Institution</th><th scope="col" className="r">Seiten</th><th scope="col">Monat C / G / I</th><th scope="col">Total C / G / I</th><th scope="col">Bilder Monat / Total</th><th scope="col" className="r">Tokens ein</th><th scope="col" className="r">Tokens aus</th><th scope="col">Letzte Seite</th></tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.email}>
                    <th scope="row"><span className="ltitle"><b>{u.name || u.email}</b>{u.name && <small>{u.email}</small>}</span></th>
                    <td className="soft">{u.institution ?? "–"}</td>
                    <td className="r">{u.pages}</td>
                    <td className="nowrap">{u.claude_month} / {u.openai_month} / {u.infomaniak_month}</td>
                    <td className="nowrap">{u.claude} / {u.openai} / {u.infomaniak}</td>
                    <td className="nowrap">{u.bilder_month} / {u.bilder}</td>
                    <td className="r nowrap">{nf(u.input_tokens)}</td>
                    <td className="r nowrap">{nf(u.output_tokens)}</td>
                    <td className="soft nowrap">{u.last_page ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="box-note foot">C = Claude, G = ChatGPT, I = Infomaniak</p>
        </section>
      )}
    </AppShell>
  );
}
