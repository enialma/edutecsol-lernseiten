import Link from "next/link";
import { LIMITS } from "@/lib/quota";
import Topbar from "../Topbar";

const STAND = "3. Oktober 2026";
// MWST-Nummer der EDUTECSOL GmbH (Format CHE-123.456.789 MWST); leer = wird nicht angezeigt
const MWST_NR = "CHE-484.488.885 MWST";

export const metadata = { title: "AGB – EDUTECSOL Lernwege" };

export default function AgbPage() {
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="kicker">Rechtliches</p>
          <h1>Allgemeine Geschäftsbedingungen</h1>
          <p className="lead">Für den geschützten Bereich von lernwege.edutecsol.ch. Stand: {STAND}.</p>

          <h2>1. Anbieterin und Geltungsbereich</h2>
          <p>
            EDUTECSOL GmbH · Alte Landstrasse 152b · 6314 Unterägeri · Schweiz{MWST_NR ? ` · ${MWST_NR}` : ""}<br />
            <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>
          </p>
          <p>
            Diese Bedingungen gelten für alle Personen, die einen kostenpflichtigen Zugang zum geschützten Bereich nutzen.
            Der Prompt-Generator und die Beispielseiten auf der Startseite sind ohne Konto und kostenlos nutzbar.
            Für Schulen und Teams mit Zugang auf Rechnung gilt ergänzend die jeweilige Offerte; bei Widersprüchen geht sie vor.
          </p>

          <h2>2. Leistung</h2>
          <ul>
            <li>Erzeugen differenzierter, interaktiver Lernseiten mit KI, pro Kalendermonat bis zu {LIMITS.claude} Lernseiten mit Claude und {LIMITS.infomaniak} mit Infomaniak. Nicht genutzte Kontingente verfallen am Monatsende.</li>
            <li>Eigene Sammlung, Freigabelinks für Lernende, Teilen mit Kolleginnen und Kollegen.</li>
            <li>Export als HTML-Datei, Word-Arbeitsblatt und SCORM-Paket sowie die Anbindung an Moodle, soweit das jeweilige Moodle sie unterstützt.</li>
          </ul>
          <p>
            EDUTECSOL entwickelt die Plattform weiter und darf Funktionen anpassen, ersetzen oder die eingesetzten
            KI-Modelle wechseln, solange der wesentliche Nutzen erhalten bleibt.
          </p>

          <h2>3. Vertragsschluss und Konto</h2>
          <ul>
            <li>Der Vertrag kommt mit der erfolgreichen ersten Zahlung zustande. Danach wird das Konto freigeschaltet.</li>
            <li>Das Angebot richtet sich an Lehrpersonen und weitere Bildungsfachleute. Das Konto ist persönlich; Zugangsdaten dürfen nicht weitergegeben oder geteilt werden.</li>
            <li>Sie sind dafür verantwortlich, Ihr Passwort geheim zu halten und uns einen Missbrauch umgehend zu melden.</li>
          </ul>

          <h2>4. Preise und Zahlung</h2>
          <ul>
            <li>Monatsabo: CHF 8 pro Monat. Jahresabo: CHF 60 pro Jahr. Beide Preise verstehen sich inklusive Schweizer Mehrwertsteuer.</li>
            <li>Die Zahlung erfolgt im Voraus für die jeweilige Laufzeit über den Zahlungsdienstleister Stripe. EDUTECSOL erhält und speichert keine Kartendaten.</li>
            <li>Preisänderungen werden mindestens 30 Tage im Voraus per E-Mail angekündigt und gelten frühestens ab der nächsten Laufzeit. Sie können vorher kündigen.</li>
          </ul>

          <h2>5. Laufzeit, Verlängerung und Kündigung</h2>
          <ul>
            <li>Das Abo verlängert sich automatisch um die gewählte Laufzeit (einen Monat oder ein Jahr), wenn es nicht vorher gekündigt wird.</li>
            <li>Sie können jederzeit auf das Ende der bezahlten Laufzeit kündigen: im geschützten Bereich unter «Abo verwalten» oder per E-Mail an <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>. Der Zugang bleibt bis zum Ende der bezahlten Laufzeit bestehen.</li>
            <li>Bereits bezahlte Beträge werden bei einer Kündigung nicht anteilig zurückerstattet.</li>
            <li>Ein gesetzliches Widerrufsrecht für Online-Käufe besteht nach Schweizer Recht nicht. Aus Kulanz erstatten wir den Betrag vollständig zurück, wenn Sie innert 14 Tagen nach dem ersten Abschluss per E-Mail vom Vertrag zurücktreten.</li>
            <li>Kann eine Verlängerung nicht abgebucht werden, endet der Zugang nach Ablauf der bezahlten Laufzeit.</li>
            <li>EDUTECSOL kann das Abo auf das Ende einer Laufzeit kündigen und bei schwerem Verstoss gegen diese Bedingungen den Zugang sofort sperren.</li>
          </ul>

          <h2>6. Ihre Inhalte und die erzeugten Lernseiten</h2>
          <ul>
            <li>Sie laden nur Material hoch, das Sie für diesen Zweck verwenden dürfen, und keine Unterlagen mit Personendaten von Lernenden oder Dritten.</li>
            <li>Die Rechte an Ihrem Material bleiben bei Ihnen. Die erzeugten Lernseiten dürfen Sie zeitlich unbegrenzt im Unterricht einsetzen, anpassen und weitergeben, auch nach dem Ende des Abos.</li>
            <li>Wenn Sie eine Lernseite für Ihre Schule oder im gemeinsamen Pool freigeben, dürfen die berechtigten Lehrpersonen sie ansehen, kopieren und im eigenen Unterricht einsetzen. Die Freigabe können Sie jederzeit zurückziehen; bereits erstellte Kopien bleiben bestehen.</li>
            <li>Nicht erlaubt sind die automatisierte Massenerzeugung, der Weiterverkauf des Zugangs und jede Nutzung für rechtswidrige Inhalte.</li>
          </ul>

          <h2>7. KI-Ergebnisse</h2>
          <p>
            Lernseiten werden von KI-Modellen erzeugt und können fachliche Fehler, ungenaue Lösungen oder unpassende
            Formulierungen enthalten. Sie prüfen jede Lernseite vor dem Einsatz im Unterricht. EDUTECSOL übernimmt keine
            Gewähr für die inhaltliche Richtigkeit, Vollständigkeit oder Eignung für einen bestimmten Lehrplan.
          </p>

          <h2>8. Verfügbarkeit</h2>
          <p>
            EDUTECSOL bemüht sich um einen zuverlässigen Betrieb, garantiert aber keine ununterbrochene Verfügbarkeit.
            Wartungen sowie Störungen bei Hosting-, KI- oder Zahlungsanbietern können den Dienst vorübergehend einschränken.
          </p>

          <h2>9. Haftung</h2>
          <p>
            EDUTECSOL haftet für Schäden aus absichtlichem oder grobfahrlässigem Verhalten. Im Übrigen ist die Haftung,
            soweit gesetzlich zulässig, ausgeschlossen, insbesondere für indirekte Schäden, Folgeschäden, Datenverlust und
            Schäden aus dem Einsatz ungeprüfter Lernseiten.
          </p>

          <h2>10. Datenschutz</h2>
          <p>Welche Daten wir bearbeiten und welche Dienstleister beteiligt sind, steht in der <Link href="/datenschutz">Datenschutzerklärung</Link>.</p>

          <h2>11. Nach dem Ende des Abos</h2>
          <p>
            Nach Ablauf können Sie sich nicht mehr anmelden. Laden Sie Lernseiten, die Sie weiter brauchen, vorher herunter.
            Konto und Lernseiten bleiben gespeichert, bis Sie die Löschung verlangen oder EDUTECSOL das Konto nach
            vorgängiger Ankündigung per E-Mail löscht. Bestehende Freigabelinks bleiben bis dahin erreichbar.
          </p>

          <h2>12. Änderungen dieser Bedingungen</h2>
          <p>
            Änderungen werden mindestens 30 Tage vor Inkrafttreten per E-Mail mitgeteilt. Wenn Sie nicht einverstanden
            sind, können Sie auf das Ende der laufenden Laufzeit kündigen; andernfalls gelten die neuen Bedingungen ab der nächsten Laufzeit.
          </p>

          <h2>13. Anwendbares Recht und Gerichtsstand</h2>
          <p>
            Es gilt Schweizer Recht. Gerichtsstand ist der Sitz der EDUTECSOL GmbH. Zwingende Gerichtsstände, insbesondere
            für Konsumentinnen und Konsumenten, bleiben vorbehalten.
          </p>

          <p style={{ marginTop: "2rem" }}><Link href="/zugang">← Zum Zugang</Link></p>
        </div>
      </main>
    </>
  );
}
