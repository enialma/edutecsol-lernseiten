import Link from "next/link";

// Fusszeile im Designsystem (gleicher Aufbau wie in public/index.html)
export default function Footer() {
  return (
    <footer className="lw-footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link className="wordmark" href="/"><span className="name">Lernwege</span><span className="by">von EDUTECSOL</span></Link>
            <p style={{ margin: ".9rem 0 0", maxWidth: "36ch" }}>Differenzierte, interaktive Lernseiten für Schweizer Schulen. Gehostet in Frankfurt, KI auf Wunsch in der Schweiz.</p>
          </div>
          <div>
            <h4>Lernwege</h4>
            <a href="/lernseiten-beispiele.html">Beispiele</a>
            <a href="/prompt-generator-v2.html">Prompt-Generator</a>
            <a href="/bild-generator.html">Bildprompt-Generator</a>
            <Link href="/zugang">Zugang &amp; Preise</Link>
          </div>
          <div>
            <h4>Konto</h4>
            <Link href="/login">Anmelden</Link>
            <Link href="/app">Mein Bereich</Link>
            <Link href="/zugang">Zugang lösen</Link>
          </div>
          <div>
            <h4>EDUTECSOL GmbH</h4>
            <a href="https://www.edutecsol.ch" rel="noopener">edutecsol.ch</a>
            <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/agb">AGB</Link>
          </div>
        </div>
        <div className="bottom">
          <span>© EDUTECSOL GmbH, Unterägeri</span>
          <span>Digitale Schulentwicklung · <Link href="/datenschutz">Datenschutz</Link> · <Link href="/agb">AGB</Link></span>
        </div>
      </div>
    </footer>
  );
}
