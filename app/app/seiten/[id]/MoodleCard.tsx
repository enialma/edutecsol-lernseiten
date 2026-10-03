"use client";
import { useState, useTransition } from "react";
import { moodleCreateAction, moodleSectionsAction, removeMoodleAction, saveMoodleAction } from "../moodle-actions";

type Section = { sectionnum: number; name: string };

export default function MoodleCard({ pageId, title, connectedBase }: { pageId: number; title: string; connectedBase: string | null }) {
  const [base, setBase] = useState(connectedBase);
  const [address, setAddress] = useState("");
  const [token, setToken] = useState("");
  const [course, setCourse] = useState("");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [sectionnum, setSectionnum] = useState(0);
  const [name, setName] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<void>) => { setError(null); start(fn); };

  const connect = () => run(async () => {
    const r = await saveMoodleAction(address, token);
    if (r.error) return setError(r.error);
    setBase(r.base ?? null); setToken("");
  });

  const disconnect = () => run(async () => {
    await removeMoodleAction();
    setBase(null); setSections(null); setCourseId(null); setDone(null);
  });

  const load = () => run(async () => {
    setDone(null);
    const r = await moodleSectionsAction(course);
    if (r.error || !r.sections) { setSections(null); return setError(r.error ?? "Keine Abschnitte gefunden."); }
    setCourseId(r.courseId ?? null); setSections(r.sections); setSectionnum(r.sections[0]?.sectionnum ?? 0);
  });

  const create = () => run(async () => {
    if (courseId === null) return;
    const r = await moodleCreateAction(pageId, courseId, sectionnum, name);
    if (r.error) return setError(r.error);
    setDone(r.courseUrl ?? null);
  });

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <p className="kicker">Für Moodle</p>
      <h3 style={{ margin: "0 0 .4rem" }}>Direkt in einen Moodle-Kurs legen</h3>

      {!base ? (
        <>
          <p className="small-note">
            Einmalig verbinden: Adresse deines Moodle und deinen persönlichen Token eintragen. Den Token findest du in Moodle unter
            Profil → Einstellungen → Sicherheitsschlüssel, Zeile «Claude MCP Service». Er wird verschlüsselt gespeichert.
          </p>
          <div className="form-grid">
            <div><label>Moodle-Adresse</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="https://moodle.meineschule.ch" /></div>
            <div><label>Token</label><input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} /></div>
          </div>
          <div style={{ marginTop: ".8rem" }}><button className="btn small" disabled={busy || !address || !token} onClick={connect}>Verbinden</button></div>
        </>
      ) : (
        <>
          <p className="small-note">
            Verbunden mit <b>{base.replace(/^https:\/\//, "")}</b>. Die Lernseite wird als Link/URL-Aktivität mit dem Freigabelink angelegt.{" "}
            <button className="btn small ghost" disabled={busy} onClick={disconnect} style={{ marginLeft: ".4rem" }}>Verbindung trennen</button>
          </p>
          <label>Kurs-Link oder Kurs-ID</label>
          <div className="row" style={{ alignItems: "center" }}>
            <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="https://…/course/view.php?id=30" style={{ flex: "1 1 240px" }} />
            <button className="btn small" disabled={busy || !course} onClick={load}>Abschnitte laden</button>
          </div>
          {sections && (
            <>
              <div className="form-grid" style={{ marginTop: ".8rem" }}>
                <div>
                  <label>Abschnitt</label>
                  <select value={sectionnum} onChange={(e) => setSectionnum(Number(e.target.value))}>
                    {sections.map((s) => <option key={s.sectionnum} value={s.sectionnum}>{s.sectionnum} · {s.name}</option>)}
                  </select>
                </div>
                <div><label>Name der Aktivität</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
              </div>
              <div style={{ marginTop: ".8rem" }}><button className="btn small terra" disabled={busy} onClick={create}>In Moodle anlegen</button></div>
            </>
          )}
        </>
      )}

      {busy && <p className="small-note" style={{ marginTop: ".6rem" }}>Einen Moment …</p>}
      {error && <p className="small-note" style={{ marginTop: ".6rem", color: "var(--err)" }}>{error}</p>}
      {done && (
        <p className="small-note" style={{ marginTop: ".6rem" }}>
          Angelegt. <a href={done} target="_blank" rel="noopener">Kurs in Moodle öffnen</a>
        </p>
      )}
    </div>
  );
}
