import { usageByUser } from "@/lib/pages";
import { listUsers } from "@/lib/users";
import Topbar from "../../Topbar";
import { createUserAction, deleteUserAction, setPasswordAction, toggleActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BenutzerPage() {
  const [users, usage] = await Promise.all([listUsers(), usageByUser()]);
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
                <div><label>Schule / Organisation</label><input name="organisation" /></div>
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
                <tr><th>E-Mail</th><th>Name / Schule</th><th>Rolle</th><th>Status</th><th>Login</th><th>Letzter Login</th><th>Aktionen</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}{u.notes && <div className="small-note">{u.notes}</div>}</td>
                    <td>{u.name}<div className="small-note">{u.organisation}</div></td>
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
                  <tr><td colSpan={7}>Noch keine Benutzer. Admins aus ADMIN_EMAILS werden beim ersten Login automatisch angelegt.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2>Nutzung</h2>
          <p className="small-note">
            Mit KI erzeugte Lernseiten pro Person ({total.pages} Seiten, {nf(total.input_tokens)} Eingabe- und{" "}
            {nf(total.output_tokens)} Ausgabe-Tokens). Kopien aus dem Pool zählen nicht, gelöschte Seiten fehlen.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>E-Mail</th><th>Seiten</th><th>Diesen Monat</th><th>Claude / Infomaniak</th><th>Tokens Eingabe</th><th>Tokens Ausgabe</th><th>Letzte Seite</th></tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}{u.name && <div className="small-note">{u.name}</div>}</td>
                    <td>{u.pages}</td>
                    <td>{u.pages_month}</td>
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
