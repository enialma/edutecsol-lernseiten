import Link from "next/link";
import Topbar from "../Topbar";

export const metadata = { title: "Datenschutz – Lernwege EDUTECSOL" };

const STAND = "3. Oktober 2026";

export default function DatenschutzPage() {
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="kicker">Rechtliches</p>
          <h1>Datenschutz</h1>
          <p className="lead">
            Was lernwege.edutecsol.ch speichert, wohin Daten fliessen und was Lehrpersonen beim Einsatz beachten sollten.
            Stand: {STAND}.
          </p>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ marginTop: 0 }}>Das Wichtigste in Kürze</h2>
            <ul>
              <li><b>Keine Daten von Lernenden.</b> Lernende öffnen Lernseiten ohne Konto. Ihre Eingaben bleiben im Browser und werden nirgends gespeichert.</li>
              <li><b>Hochgeladenes Material wird nicht aufbewahrt.</b> Aus PDF, Word oder PowerPoint wird nur der Text ausgelesen, an die gewählte KI geschickt und danach verworfen.</li>
              <li><b>Zwei KI-Anbieter zur Wahl.</b> Claude (Anthropic, Verarbeitung in den USA) oder Apertus bei Infomaniak (Verarbeitung in der Schweiz). Die Lehrperson entscheidet pro Lernseite.</li>
              <li><b>Konten nur für Lehrpersonen.</b> Gespeichert werden E-Mail, Name, Schule und Anmeldezeitpunkte. Kein Tracking, keine Werbung, keine Analyse-Cookies.</li>
            </ul>
          </div>

          <h2>1. Verantwortliche Stelle</h2>
          <p>
            EDUTECSOL GmbH · Alte Landstrasse 152b · 6314 Unterägeri · Schweiz<br /><a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a><br />
            Es gilt das Schweizer Datenschutzgesetz (DSG). Für Nutzerinnen und Nutzer aus der EU gelten zusätzlich die Grundsätze der DSGVO.
          </p>

          <h2>2. Welche Daten wir speichern</h2>
          <table>
            <thead><tr><th>Daten</th><th>Zweck</th><th>Dauer</th></tr></thead>
            <tbody>
              <tr>
                <td><b>Konto der Lehrperson</b><br /><span className="small-note">E-Mail, Name, Schule/Organisation, Rolle, Gültigkeit, Zeitpunkt und Art des letzten Logins, bei Passwort-Login ein gehashtes Passwort (bcrypt)</span></td>
                <td>Zugangskontrolle, Zuordnung der erzeugten Lernseiten, Abrechnung des Zugangs</td>
                <td>Bis zur Löschung des Kontos</td>
              </tr>
              <tr>
                <td><b>Erzeugte Lernseiten</b><br /><span className="small-note">HTML-Datei, gewählte didaktische Einstellungen, Fach, Stufe, Thema, Name der hochgeladenen Datei, verwendeter KI-Anbieter, Tokenzahl, Dauer</span></td>
                <td>Sammlung der Lehrperson, Download, Freigabe, Kostenkontrolle</td>
                <td>Bis die Lehrperson sie löscht</td>
              </tr>
              <tr>
                <td><b>Moodle-Verbindung</b> (freiwillig)<br /><span className="small-note">Adresse des Moodle und persönlicher Webservice-Token der Lehrperson, der Token verschlüsselt (AES-256)</span></td>
                <td>Lernseite auf Knopfdruck als Link in einen eigenen Moodle-Kurs legen</td>
                <td>Bis die Lehrperson die Verbindung trennt oder das Konto gelöscht wird</td>
              </tr>
              <tr>
                <td><b>Sitzungs-Cookie</b><br /><span className="small-note">Verschlüsseltes Login-Token, dazu ein CSRF-Schutz-Cookie</span></td>
                <td>Angemeldet bleiben, Schutz vor fremden Formularaufrufen</td>
                <td>14 Tage oder bis zur Abmeldung</td>
              </tr>
              <tr>
                <td><b>Server-Protokolle</b><br /><span className="small-note">IP-Adresse, Zeitpunkt, aufgerufene Adresse, Fehlermeldungen</span></td>
                <td>Betrieb, Fehlersuche, Abwehr von Missbrauch</td>
                <td>Kurzfristig beim Hosting-Anbieter</td>
              </tr>
            </tbody>
          </table>

          <h2>3. Was wir nicht speichern</h2>
          <ul>
            <li>Hochgeladene Dateien. Sie werden im Arbeitsspeicher zu Text verarbeitet und nach der Erzeugung verworfen. Nur der Dateiname bleibt als Hinweis in der Sammlung.</li>
            <li>Eingaben von Lernenden auf einer Lernseite. Lösungen, Selbstchecks und Texte verlassen den Browser der Lernenden nicht.</li>
            <li>Nutzungsstatistiken, Werbe- oder Analyse-Cookies. Es gibt keinen Google-Analytics-Einsatz und keine Social-Media-Plugins.</li>
          </ul>

          <h2>4. Beteiligte Dienstleister</h2>
          <table>
            <thead><tr><th>Dienst</th><th>Wofür</th><th>Standort / Hinweis</th></tr></thead>
            <tbody>
              <tr><td><b>Vercel Inc.</b></td><td>Hosting der Plattform, Ausführung der Server-Funktionen</td><td>Server-Funktionen in Frankfurt (EU); Vercel ist US-Unternehmen mit Standardvertragsklauseln</td></tr>
              <tr><td><b>Neon Inc.</b></td><td>Datenbank (Konten, Lernseiten)</td><td>Datenbank-Region Frankfurt (EU)</td></tr>
              <tr><td><b>Microsoft Entra ID</b></td><td>Anmeldung mit Microsoft-365-Schulkonto</td><td>Wir erhalten nur E-Mail und Anzeigename. Kein Zugriff auf Mails, Dateien oder Kalender</td></tr>
              <tr><td><b>Anthropic PBC</b> (Claude)</td><td>KI-Erzeugung der Lernseite, wenn «Claude» gewählt ist</td><td>Verarbeitung in den USA. Über die kommerzielle Schnittstelle; Eingaben werden gemäss Anthropic nicht zum Training der Modelle verwendet und nur kurz zur Missbrauchskontrolle aufbewahrt</td></tr>
              <tr><td><b>Infomaniak Network SA</b> (Apertus)</td><td>KI-Erzeugung der Lernseite, wenn «Infomaniak» gewählt ist</td><td>Verarbeitung in der Schweiz, Schweizer Unternehmen, Schweizer Modell Apertus</td></tr>
            </tbody>
          </table>
          <p>
            An die KI-Anbieter geht ausschliesslich der Text des Materials und die didaktischen Einstellungen. Keine Kontodaten, keine E-Mail-Adresse der Lehrperson.
          </p>

          <h2>5. Freigabelinks, Schule und Pool</h2>
          <ul>
            <li>Ein <b>Freigabelink</b> macht eine Lernseite ohne Login erreichbar. Die Adresse ist nicht erratbar und für Suchmaschinen gesperrt, aber jede Person mit dem Link kann die Seite öffnen. Der Link lässt sich jederzeit zurückziehen.</li>
            <li>Mit der Sichtbarkeit <b>Meine Schule</b> sehen nur angemeldete Lehrpersonen derselben Institution die Seite mit Name der Autorin oder des Autors und können sie kopieren.</li>
            <li>Im <b>gemeinsamen Pool</b> sehen alle angemeldeten Lehrpersonen die Seite mit Name der Autorin oder des Autors und können sie kopieren. Das ist freiwillig und jederzeit widerrufbar.</li>
          </ul>

          <h2>6. Was Lehrpersonen beachten sollten</h2>
          <div className="card">
            <ul style={{ margin: 0 }}>
              <li><b>Kein Material mit Personendaten hochladen.</b> Klassenlisten, Noten, Namen von Lernenden oder Mitarbeitenden gehören nicht in das Upload-Feld. Der Text geht an einen KI-Anbieter.</li>
              <li><b>Bei sensiblen Inhalten Infomaniak wählen.</b> Dann bleibt die Verarbeitung in der Schweiz.</li>
              <li><b>Urheberrecht prüfen.</b> Hochgeladene Lehrmittel müssen für diese Nutzung erlaubt sein. Eigene Unterlagen und kurze Auszüge für den Unterricht sind in der Regel unproblematisch.</li>
              <li><b>Erzeugte Lernseiten fachlich prüfen.</b> KI-Ergebnisse können Fehler enthalten. Vor dem Einsatz Lösungen und Feedback-Logik kontrollieren.</li>
              <li><b>Freigabelinks bewusst weitergeben.</b> Ein Link kann weitergeleitet werden. Für Lernende ist das unkritisch, weil keine Daten erhoben werden.</li>
            </ul>
          </div>

          <h2>7. Ihre Rechte</h2>
          <p>
            Sie können jederzeit Auskunft über Ihre gespeicherten Daten verlangen, sie berichtigen oder löschen lassen. Eigene Lernseiten löschen Sie selbst in der Sammlung.
            Die Löschung des Kontos beantragen Sie per E-Mail an <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>. Mit dem Konto werden alle zugehörigen Lernseiten gelöscht.
          </p>

          <h2>8. Sicherheit</h2>
          <ul>
            <li>Verschlüsselte Übertragung (HTTPS) auf allen Seiten.</li>
            <li>Passwörter werden nur als bcrypt-Hash gespeichert.</li>
            <li>Zugang nur für freigeschaltete E-Mail-Adressen; Konten können befristet und gesperrt werden.</li>
            <li>Erzeugte Lernseiten sind nur für die eigene Lehrperson sichtbar, ausser sie werden bewusst freigegeben.</li>
          </ul>

          <h2>9. Änderungen</h2>
          <p>Diese Seite wird angepasst, wenn neue Funktionen oder Dienstleister dazukommen. Das Datum oben zeigt den Stand.</p>

          <p style={{ marginTop: "2rem" }}><Link href="/">← Zur Startseite</Link></p>
        </div>
      </main>
    </>
  );
}
