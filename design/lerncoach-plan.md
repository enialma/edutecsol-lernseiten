# KI-Lerncoach für Lernwege – Plan (Entwurf 31.10.2026)

## Ziel
Lernende, die an einer Lernseite arbeiten, können einen Coach fragen. Der Coach stellt Fragen und gibt Impulse,
nennt nie das Ergebnis, kennt aber Aufgabe und Lösungen der Seite und kann deshalb gezielt führen.
Vorbild: Reflexions-Coach für Mahara (nur Fragen, Regeln serverseitig, Verlauf nur im Browser).

## Nutzererlebnis
- In jeder über den Freigabelink geöffneten Seite ein Knopf «Frag den Coach» (unten rechts). Öffnet ein Panel in der Seite,
  kein neuer Tab. Heruntergeladene Offline-Dateien zeigen den Knopf nicht (kein Internet).
- Kontext wird automatisch mitgegeben: Seitentyp, aktueller Reiter (Zugang A/B/C oder Level), die Aufgabe, an der gerade
  gearbeitet wird, optional die eigene Eingabe der Lernenden.
- Kein Konto, kein Name. Gespräch bleibt im Browser-Tab, nichts wird gespeichert. Hinweis dazu im Panel.
- Lehrperson schaltet den Coach pro Seite ein oder aus (Detailseite) und wählt den Stil.

## Coach-Regeln (serverseitig, nicht aushebelbar)
1. Nur Fragen und Impulse, nie das Endergebnis, nie der vollständige Rechenweg.
2. Gestufte Hilfe nach erfolglosen Versuchen: Verständnisfrage → Strategiehinweis → kleinster nächster Teilschritt.
3. Kennt die Lösungen (aus dem Lehrpersonen-Bereich der Seite) und bestätigt richtige Zwischenergebnisse mit «Richtig, warum?».
4. Bleibt beim Inhalt der Seite; führt bei anderen Themen freundlich zurück.
5. Kurz (höchstens drei Sätze), altersgerecht, Schweizer Standarddeutsch, keine persönlichen Daten erfragen.
6. Bei «sag mir die Lösung»: Gegenfrage oder Teilschritt, nie Nachgeben.
7. Technische Filter aus dem Mahara-Coach übernehmen (Meta-Präfixe, «ich weiss nicht»-Abfangen).

Stile zur Wahl der Lehrperson: «streng sokratisch» (nur Fragen) · «gestufte Hilfe» (Standard) · «Erklär-Coach» (darf
Konzepte erklären, aber keine Aufgabe lösen).

## Technik
- `app/coach/[token]/page.tsx`: Chat-Oberfläche im Lernwege-Design, iframe-tauglich.
- `app/api/coach/route.ts`: streamt Antworten; Standard Infomaniak (Schweiz), optional Claude pro Seite.
  Kontext = Seiteninhalt als Text (Aufgaben + Lehrpersonen-Bereich), je Seite zwischengespeichert; bei Claude Prompt-Caching.
- Einbettung: beim Ausliefern über `/s/<token>` wird ein kleines Script eingesetzt (wie die Druckvorlage), das Knopf und Panel
  ergänzt. Offline-Download bleibt unverändert. SCORM/Moodle: Script lädt per absoluter Adresse, Coach funktioniert online.
- Schutz und Kosten: Rate-Limit pro Browser (z. B. 30 Nachrichten pro Stunde), Nachrichtenlänge begrenzt, Kontingent pro
  Lehrperson und Monat; bei Überschreitung freundliche Abschaltung. Protokoll nur Zähler (Seite, Tag, Tokens), keine Inhalte.
- Datenbank: `pages.coach` (an/aus), `pages.coach_stil`, Tabelle `coach_usage` (page_id, tag, nachrichten, tokens).
- Datenschutzseite ergänzen (neuer Verarbeitungszweck, kein Speichern von Gesprächen, Anbieter je nach Wahl).

## Etappen und Aufwand
1. Prototyp (2 Tage): Panel + API für Lernseiten via Freigabelink, Infomaniak, Zähler, Schalter auf der Detailseite.
2. Didaktik (1–2 Tage): gestufte Hilfe, Lösungskenntnis, Stilwahl, Datenschutztext, Kontingent.
3. Ausbau (1–2 Tage): Moodle/SCORM, anonyme Auswertung für die Lehrperson (Anzahl Fragen je Zugang/Aufgabe),
   Coach in Lernspiel (nach Fehlversuch) und Prüfungsvorbereitung (nur Teil C, in der Übungsprüfung aus).

## Entscheide (Enikö)
1. Kosten: Coach-Nachrichten im Abo enthalten (z. B. 500 pro Lehrperson und Monat, Schule 5000) oder Zusatzoption?
2. Modell: Infomaniak als Standard (Schweiz, günstig), Claude optional je Seite?
3. Standard-Stil: streng sokratisch wie Mahara oder gestufte Hilfe?
4. Coach auch in Lernspiel und Prüfungsvorbereitung ab Etappe 1 oder erst später?
5. Moodle/SCORM-Einbettung nötig für den Start?
6. Name im Produkt: «Coach», «Lernbegleiter», anderer?
