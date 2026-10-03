import { LIMITS, usageByUser } from "@/lib/quota";
import { listInstitutions, listUsers } from "@/lib/users";
import Topbar from "../../Topbar";
import {
  createInstitutionAction, createUserAction, deleteInstitutionAction, deleteUserAction, renameInstitutionAction,
  setInstitutionAction, setPasswordAction, toggleActiveAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function BenutzerPage() {
  const [users, usage, institutions] = await Promise.all([listUsers(), usageByUser(), listInstitutions()]);
  const total = usage.reduce((t, u) => ({ pages: t.pages + u.pages, input_tokens: t.input_tokens + u.input_tokens, output_tokens: t.output_tokens + u.output_tokens }), { pages: 0, input_tokens: 0, output_tokens: 0 });
  const nf = (n: number) => n.toLocaleString("de-CH");
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Administration</p>
          <h1>Benutzer</h1>
          <p className="lead">
            Nur hier eingetragene und aktive E-Mail-Adressen können sich anmelden – mit Microsoft 365 oder, wenn ein
            Passwort gesetzt ist, mit Passwort.
          </p>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Neuen Zugang anlegen</h2>
            <form action={createUserAction}>
              <div className="form-grid">
                <div><label>E-Mail *</label><input name="email" type="email" required /></div>
                <div><label>Name</label><input name="name" /></div>
                <div>
                  <label>Institution</label>
                  <select name="institution_id" defaultValue="">
                    <option value="">keine</option>
                    {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div><label>Gültig bis (optional)</label><input name="valid_until" type="date" /></div>
                <div>
                  <label>Rolle</label>
                  <select name="role" defaultValue="user">
                    <option value="user">Lehrperson</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div><label>Passwort (leer = nur Microsoft-Login)</label><input name="password" type="text" autoComplete="off" minLength={8} /></div>
              </div>
              <label>Notiz</label>
              <input name="notes" />
              <div style={{ marginTop: "1rem" }}><button className="btn">Anlegen</button></div>
            </form>
          </div>

          <h2>Alle Zugänge ({users.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>E-Mail</th><th>Name</th><th>Institution</th><th>Rolle</th><th>Status</th><th>Login</th><th>Letzter Login</th><th>Aktionen</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}{u.notes && <div className="small-note">{u.notes}</div>}</td>
                    <td>{u.name}</td>
                    <td>
                      <form action={setInstitutionAction} className="row">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="institution_id" defaultValue={u.institution_id ?? ""} style={{ width: 170, padding: ".35rem .5rem", fontSize: ".8rem" }}>
                          <option value="">keine</option>
                          {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <button className="btn small ghost">Setzen</button>
                      </form>
                    </td>
                    <td>{u.role === "admin" ? "Admin" : "Lehrperson"}</td>
                    <td>
                      <span className={`badge ${u.active ? "ok" : "off"}`}>{u.active ? "aktiv" : "gesperrt"}</span>
                      {u.valid_until && <div className="small-note">bis {u.valid_until}</div>}
                    </td>
                    <td>{u.has_password ? "M365 + Passwort" : "M365"}</td>
                    <td>{u.last_login_at ?? "–"}{u.last_login_via && <div className="small-note">{u.last_login_via}</div>}</td>
                    <td>
                      <div className="row">
                        <form action={toggleActiveAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                          <button className="btn small ghost">{u.active ? "Sperren" : "Aktivieren"}</button>
                        </form>
                        <form action={setPasswordAction} className="row">
                          <input type="hidden" name="id" value={u.id} />
                          <input name="password" placeholder="neues Passwort" minLength={8} style={{ width: 150, padding: ".35rem .5rem", fontSize: ".8rem" }} />
                          <button className="btn small ghost">Setzen</button>
                        </form>
                        <form action={deleteUserAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="btn small ghost" style={{ color: "var(--err)" }}>Löschen</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8}>Noch keine Benutzer. Admins aus ADMIN_EMAILS werden beim ersten Login automatisch angelegt.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2>Institutionen ({institutions.length})</h2>
          <p className="small-note">
            Lehrpersonen derselben Institution können Lernseiten nur untereinander freigeben («Meine Schule»). Wird eine
            Institution gelöscht, bleiben die Konten bestehen; für die Schule freigegebene Seiten sieht dann nur noch die Autorin.
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Konten</th><th>Aktionen</th></tr></thead>
              <tbody>
                {institutions.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <form action={renameInstitutionAction} className="row">
                        <input type="hidden" name="id" value={i.id} />
                        <input name="name" defaultValue={i.name} style={{ flex: "1 1 220px", padding: ".35rem .5rem", fontSize: ".85rem" }} />
                        <button className="btn small ghost">Umbenennen</button>
                      </form>
                    </td>
                    <td>{i.users}</td>
                    <td>
                      <form action={deleteInstitutionAction}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="btn small ghost" style={{ color: "var(--err)" }}>Löschen</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {institutions.length === 0 && <tr><td colSpan={3}>Noch keine Institution angelegt.</td></tr>}
              </tbody>
            </table>
          </div>
          <form action={createInstitutionAction} className="row" style={{ marginTop: ".8rem", alignItems: "center" }}>
            <input name="name" placeholder="Name der neuen Institution" required style={{ flex: "1 1 240px" }} />
            <button className="btn small">Institution anlegen</button>
          </form>

          <h2>Nutzung</h2>
          <p className="small-note">
            Mit KI erzeugte Lernseiten pro Person ({total.pages} Seiten, {nf(total.input_tokens)} Eingabe- und{" "}
            {nf(total.output_tokens)} Ausgabe-Tokens). Gelöschte Seiten zählen weiter mit; die Tokens enthalten auch
            misslungene Versuche. Monatskontingent pro Person: {LIMITS.claude} mit Claude, {LIMITS.infomaniak} mit
            Infomaniak (Admins ohne Limit).
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>E-Mail</th><th>Institution</th><th>Seiten</th><th>Diesen Monat Claude / Infomaniak</th><th>Total Claude / Infomaniak</th><th>Tokens Eingabe</th><th>Tokens Ausgabe</th><th>Letzte Seite</th></tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}{u.name && <div className="small-note">{u.name}</div>}</td>
                    <td>{u.institution ?? "–"}</td>
                    <td>{u.pages}</td>
                    <td>{u.claude_month} / {u.infomaniak_month}</td>
                    <td>{u.claude} / {u.infomaniak}</td>
                    <td>{nf(u.input_tokens)}</td>
                    <td>{nf(u.output_tokens)}</td>
                    <td>{u.last_page ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
