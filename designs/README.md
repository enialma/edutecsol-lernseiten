# Designs für Lernseiten

Jede `.css`-Datei in diesem Ordner ist ein Design, das eine Lernseite haben kann. Der Server setzt es beim
Speichern in den Block `<style id="lw-basis">` der Seite ein. Die Struktur der Seite (HTML) ist für alle Designs
gleich; ein Design bestimmt nur das Aussehen.

## Dateien

- `_funktion.css`: Regeln, die jede Seite braucht (Reiter ein- und ausblenden, Auswertung, Lernkarten).
  Wird immer nach dem Design eingesetzt. Nicht für Gestaltung verwenden.
- `klassisch.css`: das Standarddesign. Es ist zugleich die Referenz, die die KI im Prompt sieht.
- weitere `*.css`: zusätzliche Designs.

## Neues Design anlegen

1. `klassisch.css` kopieren, Dateiname nur aus `a-z`, `0-9` und `-` (er wird zur Kennung, z. B. `frisch.css`).
2. Kopfkommentar anpassen:
   ```css
   /*
     @name Frisch
     @beschreibung Ein Satz für die Auswahl beim Erzeugen.
     @farben #123456 #654321 #ABCDEF #F5F5F5
     @reihenfolge 2
   */
   ```
   `@farben` sind die Farbtupfer der Vorschaukarte, `@reihenfolge` die Position in der Auswahl.
3. Werte ändern, dabei:
   - dieselben Klassen wie `klassisch.css` gestalten (`.btn`, `.tab`, `.card`, `.hint`, `.choice` …) und
     dieselben Variablen in `:root{…}` setzen (`--navy`, `--terra`, `--ochre`, `--cream`, `--ok`, `--err` …),
     denn die KI verwendet diese Variablen auch im eigenen CSS der Seite;
   - nur Systemschriften, keine Webfonts und keine externen Dateien (die Seiten laufen offline);
   - helle Hintergründe (Grafiken der KI sind oft auf Weiss gezeichnet). Für ein dunkles Design
     `dunkel.css` als Vorlage nehmen und `@dunkel ja` in den Kopf schreiben: Grafiken (`.viz`, `svg`)
     bekommen dort eine helle Fläche mit den Farben von Klassisch, gedruckt wird hell, und feste helle
     Hintergründe im eigenen CSS der Seite (z. B. `background:#fff`) ersetzt der Server bei der
     Auslieferung durch `var(--card)`;
   - genug Kontrast für Text und Rückmeldungen (mindestens 4.5:1);
   - keine `display`-Regeln für `.panel`, `.score` und `.loesung`.
4. `npm run dev` oder `node scripts/build-designs.mjs` ausführen; das erzeugt `lib/designs.generated.ts`.
   Diese Datei mit committen.
