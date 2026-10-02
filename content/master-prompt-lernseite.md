# MASTER-PROMPT – Differenzierte interaktive Lernseite aus einem Foliensatz

> Vor dem Absenden nur den Block «ANPASSEN» ausfüllen. Alles darunter bleibt unverändert.
> Datei (PPTX/PDF) mit hochladen.

---

## ■ ANPASSEN
- **Fach/Kontext:** [z. B. Mathematik BM · Pharma-Fachrechnen · IT-Security]
- **Zielstufe:** [z. B. Berufsmaturität · FaGe · Sek II]
- **Thema (optional):** [leer lassen = KI wählt selbst; oder z. B. «Dosisberechnung», «Folie 12–14»]
- **Art der Kernkompetenz (optional):** [Rechnen · Zuordnen/Klassifizieren · Beurteilen/Erkennen]
- **Datei:** [wird hochgeladen]

---

## ■ ROLLE
Du bist Fachdidaktiker:in für das oben genannte Fach auf der genannten Zielstufe und Frontend-Entwickler:in.

## ■ AUFGABE
Lies den hochgeladenen Foliensatz (PPTX/PDF) aus, wähle das didaktisch geeignetste Thema für eine differenzierte Übung (sofern oben keines vorgegeben ist) und erstelle daraus eine interaktive Lernseite.

## ■ THEMENWAHL
Wähle einen Inhalt mit einer klaren, überprüfbaren Kompetenz – ein berechenbares Verfahren, eine eindeutige Klassifikation oder eine begründbare Beurteilung –, der sich für Selbstkontrolle mit eindeutigen Lösungen eignet und Raum für einen Aha-Moment in der Vertiefung bietet. Nenne zu Beginn kurz, welches Thema du gewählt hast und warum. Enthält der Foliensatz einen konkreten Aufgabentext oder Datensatz, verwende diesen; stehen an der Stelle nur Bilder ohne auslesbaren Text, wähle ein fachlich stimmiges, alltagsnahes Beispiel und weise am Ende darauf hin.

## ■ KOMPETENZZIEL
Leite aus dem gewählten Folieninhalt ein präzises Kompetenzziel ab (berechnen / unterscheiden / interpretieren).

## ■ KERNAUFGABE FÜR ALLE
Formuliere eine Kernaufgabe mit (1) Berechnung/Bestimmung, (2) nachvollziehbarem Rechen- oder Begründungsweg und (3) einem sachlichen Ergebnissatz. Definiere zugleich die Erfolgskriterien.

## ■ AUSGABEFORMAT
Erstelle eine einzige, voll funktionsfähige interaktive HTML-Seite (eine Datei, ohne externe Abhängigkeiten, offline lauffähig) mit folgendem Aufbau:

- **Visualisierung** der Kernaufgabe als durchgehende Leitidee, passend zum Thema (Zahlenstrahl, Anteils-Balken, Boxplot, Zuordnungsfeld, Behälter o. Ä.). Optionale Hilfslinien/Marker erscheinen erst, wenn die Lernenden korrekt gearbeitet haben.
- **Zugangswahl per Klick** (Reiter A / B / C): Die Lernenden sehen nur ihren gewählten Zugang.
- **Zugang A – Mit Unterstützung:** gleiche Kernaufgabe und Erfolgskriterien; kurze Erklärung der Fachbegriffe; ein interaktiver Rechen- bzw. Zuordnungsrahmen mit Eingabefeldern oder Auswahlbuttons, die bei korrekter Eingabe ein grünes Häkchen zeigen und bei falscher einen Hinweis geben, ohne die Lösung zu verraten; drei Leitfragen; ein Satzanfang für den Ergebnissatz. Weder Rechnung noch Ergebnis vollständig nennen.
- **Zugang B – Eigenständig:** gleiche Kernaufgabe ohne Hilfen; eine freiwillige Ergebnisprüfung (Eingabefelder/Auswahl mit Feedback) und eine Selbstcheck-Liste mit vier Fragen zum Abhaken.
- **Zugang C – Vertiefung:** zuerst die Kernaufgabe; danach ein thematisch passender Twist, der zusätzliche Denkarbeit verlangt statt nur mehr Aufgaben (z. B. ein Ausreisser, mehrere Fälle mit gleichem Ergebnis, ein Grenzfall, ein bewusst eingebauter Fehler zum Erkennen). Ergänze eine Begründungsfrage und eine Transferfrage in den Berufskontext. Baue einen Button ein, der den Kernzusammenhang sichtbar macht (Aha-Moment).
- **Bereich «Für die Lehrperson»:** ausklappbar (verborgen bis Klick), mit vollständigen Lösungen und Rechen- bzw. Begründungswegen, getrennt vom Aufgabenteil. Ergänze dort einen Satz zum didaktischen Anschluss an die nächsten Folien des Satzes.
- **PDF-Button** oben auf der Seite («Als PDF herunterladen»): Er blendet für den Export alle drei Zugänge (A/B/C) und den Lehrpersonen-Bereich ein und löst den Druckdialog des Browsers aus («In PDF speichern»). Über eine eigene Druck-CSS (`@media print`) werden Reiter und Buttons ausgeblendet und alle Inhalte sichtbar gemacht. Baue einen Fallback ein, der die Seite in einem neuen Tab öffnet, falls der Druckdialog in einer eingebetteten Vorschau blockiert ist.

## ■ GESTALTUNG
Ruhiges, altersgerechtes Design für die Zielstufe; die themenpassende Visualisierung als visuelle Leitidee; Farbwelt zum Fach passend (z. B. sachlich-technisch bei IT); responsiv bis Mobile; Tastaturbedienbarkeit und sichtbarer Fokus. Vermeide generische KI-Optik (keine cremefarbenen Hintergründe, keine Akzentstreifen).

## ■ VORGABEN
Schweizer Standarddeutsch · keine Fehler: rechne alle Lösungen bzw. prüfe alle Zuordnungen vor der Ausgabe selbst nach und stelle sicher, dass die Feedback-Logik der Eingabefelder exakt zu den richtigen Werten passt · Selbstcheck-Listen abhakbar. Gib mir am Ende eine kurze Notiz, welches Thema du gewählt hast und welchen Twist die Vertiefung nutzt.
