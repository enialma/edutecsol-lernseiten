import Link from "next/link";
import { auth } from "@/auth";
import Topbar from "../Topbar";

export default async function AppHome() {
  const session = await auth();
  const name = session?.user?.name || session?.user?.email;
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>Willkommen, {name}</h1>
          <p className="lead">
            Hier entstehen die Werkzeuge, die über den Prompt-Generator hinausgehen: Lernseiten direkt erzeugen,
            sammeln und in Moodle bringen.
          </p>
          <div className="grid">
            <Link className="tile" href="/prompt-generator-v2.html">
              <span className="badge">verfügbar</span>
              <h3>Prompt-Generator</h3>
              <p>Prompt zusammenstellen und mit eigenem Material an Claude schicken.</p>
              <span className="foot">Öffnen →</span>
            </Link>
            <div className="tile soon">
              <span className="badge new">in Arbeit</span>
              <h3>Lernseite direkt erzeugen</h3>
              <p>Material hochladen, Achsen wählen, fertige HTML-Lernseite erhalten – ohne Medienbruch.</p>
              <span className="foot">bald</span>
            </div>
            <div className="tile soon">
              <span className="badge">geplant</span>
              <h3>Meine Sammlung</h3>
              <p>Erzeugte Lernseiten ablegen, nach Fach und Stufe filtern, mit Kolleginnen und Kollegen teilen.</p>
              <span className="foot">später</span>
            </div>
            <div className="tile soon">
              <span className="badge">geplant</span>
              <h3>Nach Moodle exportieren</h3>
              <p>Lernseite als SCORM-Paket oder direkt in einen Moodle-Kurs legen.</p>
              <span className="foot">später</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
