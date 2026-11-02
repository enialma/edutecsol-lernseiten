// Designbasis für erzeugte Lernseiten (Etappe 4 der Design-Modernisierung, Oktober 2026).
// Das Modell übernimmt dieses CSS unverändert als erstes <style>-Element und baut die Seite nach dem Grundgerüst.
// Offline-tauglich: keine Webfonts, keine externen Dateien. Schriften: Serife für Titel (Georgia-Stapel), Sans für Text.
// Farben wie die Plattform lernwege.edutecsol.ch: Navy, Terra, Ocker; Flaechen hellgrau (kein Creme/Orange mehr, 02.11.2026).
// Nach Änderungen: node scripts/sync-design-basis.mjs (überträgt die Basis in den statischen Prompt-Generator).

export const DESIGN_CSS = `:root{--paper:#F2F3F5;--card:#FFFFFF;--ink:#1E3246;--ink-soft:#5B6572;--line:#E1E4E8;--line-strong:#C9CED5;--navy:#1E3246;--terra:#B84816;--terra-deep:#9A3A10;--ochre:#F1A51A;--cream:#F8F9FA;--ok:#2F8F6F;--ok-soft:#DFF3EA;--err:#B8321A;--err-soft:#FBE6E1;--serif:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif;--sans:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;--r:8px;--r-lg:12px}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.55;padding:clamp(1rem,4vw,2.5rem) 1rem 4rem}
.wrap{max-width:820px;margin:0 auto}
.eyebrow{font-size:.76rem;letter-spacing:.12em;text-transform:uppercase;color:var(--terra);font-weight:600;margin:0 0 .5rem}
h1,h2,h3{font-family:var(--serif);font-weight:600;line-height:1.15;color:var(--ink);letter-spacing:-.01em}
h1{font-size:clamp(1.8rem,5vw,2.5rem);margin:0 0 .5rem}
h2{font-size:1.35rem;margin:0 0 .7rem}
h3{font-size:1.1rem;margin:1.1rem 0 .4rem}
.lead{font-size:1.05rem;color:var(--ink-soft);margin:0 0 1.4rem;max-width:62ch}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;margin-bottom:1.6rem}
.top>div{flex:1 1 320px;min-width:0}
.btn{font:inherit;font-size:.9rem;font-weight:600;background:var(--navy);color:#fff;border:1px solid var(--navy);border-radius:var(--r);padding:.6rem 1.1rem;cursor:pointer;display:inline-flex;align-items:center;gap:.5rem}
.btn:hover{background:#2B4259;border-color:#2B4259}
.btn.ghost{background:#fff;color:var(--ink);border-color:var(--line-strong)}
.btn.ghost:hover{border-color:var(--terra);color:var(--terra)}
.btn.terra{background:var(--terra);border-color:var(--terra)}
.btn.terra:hover{background:var(--terra-deep);border-color:var(--terra-deep)}
.core{background:var(--card);border:1px solid var(--line-strong);border-radius:var(--r-lg);padding:1.4rem 1.5rem;margin:0 0 1.8rem}
.core .task{font-family:var(--serif);font-size:1.08rem}
.data{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.05rem;background:var(--cream);border:1px solid var(--line);border-radius:var(--r);padding:.7rem 1rem;margin:.6rem 0 1rem;letter-spacing:.04em;overflow-x:auto}
.viz{margin:1rem 0 .4rem}
.pick{font-size:.85rem;color:var(--ink-soft);margin:0 0 .6rem}
.tabs{display:flex;gap:.6rem;flex-wrap:wrap;margin:0 0 1.4rem}
.tab{flex:1 1 200px;text-align:left;cursor:pointer;background:var(--card);border:1px solid var(--line-strong);border-radius:var(--r-lg);padding:.85rem 1rem;font:inherit;color:var(--ink);transition:border-color .15s,background .15s}
.tab:hover{border-color:var(--terra)}
.tab:focus-visible,.btn:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--terra);outline-offset:2px}
.tab .tname{display:block;font-family:var(--serif);font-size:1.08rem;font-weight:600}
.tab .tsub{display:block;font-size:.8rem;color:var(--ink-soft);margin-top:.15rem}
.tab.active{border-color:var(--terra);background:#fff;box-shadow:inset 0 0 0 1px var(--terra)}
.tab.active .tname{color:var(--terra)}
.panel{display:none}
.panel.show{display:block;animation:rise .3s ease}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);padding:1.2rem 1.4rem;margin:0 0 1rem}
.aufgabe{border-left:3px solid var(--terra);padding:.1rem 0 .1rem 1rem;margin:0 0 1rem;font-family:var(--serif);font-size:1.04rem}
.hint{background:var(--cream);border-left:3px solid var(--ochre);border-radius:0 var(--r) var(--r) 0;padding:.6rem .9rem;margin:.6rem 0;font-size:.92rem}
.steps{margin:0;padding-left:1.25rem}.steps li{margin:.35rem 0}
.field{display:grid;grid-template-columns:minmax(140px,1fr) minmax(120px,160px) auto;gap:.5rem .8rem;align-items:center;margin:.5rem 0}
@media(max-width:560px){.field{grid-template-columns:1fr}}
.field label{font-weight:600;font-size:.92rem}
input[type=text],input[type=number],select,textarea{font:inherit;width:100%;padding:.5rem .7rem;border:1px solid var(--line-strong);border-radius:var(--r);background:#fff;color:var(--ink)}
input.ok,select.ok,textarea.ok{border-color:var(--ok);background:var(--ok-soft)}
input.err,select.err,textarea.err{border-color:var(--err)}
.feedback{font-size:.88rem;min-height:1.2em}
.feedback.ok{color:var(--ok);font-weight:600}
.feedback.err{color:var(--err)}
.choices{display:flex;flex-wrap:wrap;gap:.5rem;margin:.5rem 0}
.choice{font:inherit;font-size:.92rem;background:#fff;border:1px solid var(--line-strong);border-radius:var(--r);padding:.5rem .9rem;cursor:pointer;color:var(--ink)}
.choice:hover{border-color:var(--terra)}
.choice.on{border-color:var(--navy);background:var(--cream)}
.choice.ok{background:var(--ok-soft);border-color:var(--ok);color:var(--ok)}
.choice.err{background:var(--err-soft);border-color:var(--err);color:var(--err)}
.check{list-style:none;margin:.5rem 0 0;padding:0}
.check li{display:flex;gap:.6rem;align-items:flex-start;padding:.4rem 0;border-top:1px solid var(--line)}
.check li:first-child{border-top:0}
.check input{width:auto;margin-top:.3rem;accent-color:var(--terra)}
.reveal{margin-top:.8rem}
.aha{background:var(--navy);color:#fff;border-radius:var(--r-lg);padding:1rem 1.2rem;margin:.8rem 0}
.aha h3{color:var(--ochre);margin:0 0 .4rem}
.lehrperson{margin-top:2rem;border:1px solid var(--terra);border-radius:var(--r-lg);background:#fff}
.lehrperson>summary{cursor:pointer;padding:.9rem 1.2rem;font-weight:600;color:var(--terra);list-style:none}
.lehrperson>summary::-webkit-details-marker{display:none}
.lehrperson>summary::before{content:"+";display:inline-block;width:1.2rem;font-family:var(--serif)}
.lehrperson[open]>summary::before{content:"–"}
.lehrperson>div{padding:0 1.2rem 1.2rem;border-top:1px solid var(--line)}
table{width:100%;border-collapse:collapse;font-size:.92rem;background:#fff}
th,td{text-align:left;padding:.45rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--cream);font-size:.76rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft)}
.foot{margin-top:2.5rem;font-size:.78rem;color:var(--ink-soft);border-top:1px solid var(--line);padding-top:.8rem}
.sr{position:absolute;left:-9999px}
/* Prüfungsvorbereitung */
.exam-head{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;padding:.8rem 1rem;border:1px solid var(--line-strong);border-radius:var(--r-lg);background:#fff;margin:0 0 1rem}
.timer{font-family:var(--serif);font-size:1.6rem;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.timer.over{color:var(--err)}
.pts{float:right;font-size:.78rem;color:var(--ink-soft);border:1px solid var(--line);border-radius:999px;padding:.1rem .55rem;margin-left:.6rem}
.score{display:none;background:var(--navy);color:#fff;border-radius:var(--r-lg);padding:1.1rem 1.3rem;margin:1rem 0}
.score.show{display:block}
.score .nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.8rem;margin:.3rem 0 .8rem}
.score b{display:block;font-family:var(--serif);font-size:2rem;line-height:1;color:var(--ochre)}
.score span{font-size:.82rem;color:#C3CCD6}
.score table{background:transparent;color:#fff}.score th{background:transparent;color:#C3CCD6}.score td,.score th{border-color:#3A5068}
.meter{height:8px;background:var(--cream);border-radius:999px;overflow:hidden;margin:.4rem 0}
.meter i{display:block;height:100%;background:var(--terra);width:0;transition:width .4s}
.loesung{display:none;margin-top:.6rem;padding:.6rem .9rem;background:var(--cream);border-radius:var(--r);font-size:.92rem}
.loesung.show{display:block}
.plan td:first-child{font-weight:600;white-space:nowrap}
/* Lernspiel */
.hud{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:.6rem;margin:0 0 .8rem}
.stat{background:#fff;border:1px solid var(--line-strong);border-radius:var(--r-lg);padding:.55rem .8rem;text-align:center}
.stat b{display:block;font-family:var(--serif);font-size:1.5rem;line-height:1.1}
.stat span{font-size:.74rem;color:var(--ink-soft)}
.tab.locked{opacity:.45;cursor:not-allowed}
.tab.done .tname::after{content:" ✓";color:var(--ok)}
.q{font-family:var(--serif);font-size:1.35rem;line-height:1.3;margin:.2rem 0 .8rem}
.choices.grid2{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
@media(max-width:560px){.choices.grid2{grid-template-columns:1fr}}
.choice.sel{border-color:var(--navy);background:var(--cream)}
.choice.done{background:var(--ok-soft);border-color:var(--ok);color:var(--ok);pointer-events:none}
.pairs{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
.order .choice::before{content:attr(data-n) " ";color:var(--terra);font-weight:600}
.next{display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap;margin-top:1rem;min-height:2.4rem}
.msg-level{background:var(--cream);border-radius:var(--r);padding:.7rem .9rem;margin:.6rem 0;font-size:.95rem}
/* Lernhilfe */
.merk{columns:2;column-gap:2rem}@media(max-width:700px){.merk{columns:1}}
.merk>*{break-inside:avoid}
.formel{font-family:ui-monospace,Menlo,Consolas,monospace;background:var(--cream);border:1px solid var(--line);border-radius:var(--r);padding:.35rem .7rem;display:inline-block;margin:.2rem 0}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.8rem;margin:.8rem 0}
.fc{perspective:1000px;min-height:160px;cursor:pointer}
.fc .in{position:relative;min-height:160px;height:100%;transition:transform .4s;transform-style:preserve-3d}
.fc.flipped .in{transform:rotateY(180deg)}
.fc .f,.fc .b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#fff;border:1px solid var(--line-strong);border-radius:var(--r-lg);padding:1rem;display:flex;align-items:center;justify-content:center;text-align:center}
.fc .f{font-family:var(--serif);font-size:1.1rem}
.fc .b{transform:rotateY(180deg);background:var(--cream);font-size:.95rem}
.fc.known .f,.fc.known .b{border-color:var(--ok)}
.fc.again .f,.fc.again .b{border-color:var(--terra)}
.fc-actions{display:flex;gap:.4rem;justify-content:center;margin-top:.4rem}
.fc-actions .btn{padding:.35rem .7rem;font-size:.8rem}
.gloss{margin:0}.gloss dt{font-weight:600;margin-top:.8rem;font-family:var(--serif);font-size:1.05rem}.gloss dt small{font-family:var(--sans);font-weight:400;color:var(--ink-soft);margin-left:.4rem}
.gloss dd{margin:.1rem 0 0;color:var(--ink-soft)}.gloss dd em{color:var(--ink);font-style:normal}
.search{margin:.4rem 0 .8rem}
@media print{.fc .in{transform:none!important}.fc .f,.fc .b{position:static;transform:none;backface-visibility:visible}.fc .b{margin-top:.3rem}.cards{grid-template-columns:1fr 1fr}.fc{break-inside:avoid}.fc-actions,.search{display:none}}`;

/** Grundgerüst Lernseite (Klassen aus DESIGN_CSS). */
export const DESIGN_SKELETON = `<body><div class="wrap">
<header class="top"><div><p class="eyebrow">Fach · Stufe · Thema</p><h1>Titel der Lernseite</h1><p class="lead">Ein Satz zur Kernaufgabe. Wähle deinen Zugang.</p></div><button class="btn ghost pdf" type="button">Als PDF herunterladen</button></header>
<section class="core"><h2>Die Kernaufgabe</h2><p class="task">…</p><div class="data">… (nur falls Daten/Werte)</div><div class="viz">… themenpassende Visualisierung (SVG/HTML)</div><ol class="steps"><li>…</li></ol></section>
<p class="pick">Wähle deinen Zugang:</p>
<div class="tabs" role="tablist"><button class="tab active" role="tab" aria-selected="true" aria-controls="p-a" id="t-a"><span class="tname">A · Mit Unterstützung</span><span class="tsub">kurze Beschreibung</span></button> …</div>
<section class="panel show" id="p-a" role="tabpanel" aria-labelledby="t-a"><div class="card"><h2>Zugang A · …</h2><p class="aufgabe">…</p><div class="hint">…</div><div class="field"><label for="a1">…</label><input id="a1" type="number"><span class="feedback" aria-live="polite"></span></div><ul class="check"><li><input type="checkbox" id="c1"><label for="c1">…</label></li></ul></div></section>
… weitere Zugänge als section.panel (ohne show) …
<details class="lehrperson"><summary>Für die Lehrperson: Lösungen, Wege, Anschluss</summary><div>…</div></details>
<p class="foot">Lernseite erzeugt mit Lernwege (EDUTECSOL). Fach · Stufe · Datum.</p>
</div></body>`;

/** Grundgerüst Prüfungsvorbereitung (Klassen aus DESIGN_CSS). */
export const DESIGN_SKELETON_PRUEFUNG = `<body><div class="wrap">
<header class="top"><div><p class="eyebrow">Fach · Stufe · Prüfungsvorbereitung</p><h1>Titel: Prüfungsstoff</h1><p class="lead">Ein Satz: Was geprüft wird, wie du dich hier vorbereitest.</p></div><button class="btn ghost pdf" type="button">Als PDF herunterladen</button></header>
<section class="core"><h2>Lernziele und Gewichtung</h2><table><thead><tr><th>Nr.</th><th>Ich kann …</th><th>Punkte</th></tr></thead><tbody><tr><td>Z1</td><td>…</td><td>…</td></tr></tbody></table></section>
<p class="pick">Wähle deinen Teil:</p>
<div class="tabs" role="tablist"><button class="tab active" role="tab" aria-selected="true" aria-controls="p-a" id="t-a"><span class="tname">A · Lernziele checken</span><span class="tsub">Wo stehe ich?</span></button><button class="tab" role="tab" aria-selected="false" aria-controls="p-b" id="t-b"><span class="tname">B · Übungsprüfung</span><span class="tsub">… Minuten, … Punkte</span></button><button class="tab" role="tab" aria-selected="false" aria-controls="p-c" id="t-c"><span class="tname">C · Lücken schliessen</span><span class="tsub">Merken, üben, planen</span></button></div>
<section class="panel show" id="p-a" role="tabpanel" aria-labelledby="t-a"><div class="card"><h2>Lernziele checken</h2><div class="card" data-ziel="z1"><h3>Z1 · Ich kann …</h3><div class="choices"><button class="choice" type="button" data-wert="sicher">sicher</button><button class="choice" type="button" data-wert="unsicher">unsicher</button><button class="choice" type="button" data-wert="nein">noch nicht</button></div><p class="aufgabe">Kontrollfrage …</p><div class="field"><label for="k1">Antwort</label><input id="k1" type="text"><span class="feedback" aria-live="polite"></span></div></div><button class="btn terra" type="button" id="check-a">Auswerten</button><div class="score" id="score-a"><div class="nums"><div><b>0/6</b><span>Lernziele sicher</span></div></div><p>Zu wiederholen in Teil C: …</p></div></div></section>
<section class="panel" id="p-b" role="tabpanel" aria-labelledby="t-b"><div class="exam-head"><div><strong>Übungsprüfung</strong> · … Minuten · … Punkte</div><div><span class="timer" id="timer">00:00</span> <button class="btn ghost" type="button" id="timer-btn">Start</button></div></div><div class="card" data-ziel="z1"><h3>Aufgabe 1 <span class="pts">3 Punkte</span></h3><p class="aufgabe">…</p><div class="field"><label for="b1">…</label><input id="b1" type="number"><span class="feedback" aria-live="polite"></span></div><div class="loesung">Lösungsweg …</div></div><button class="btn terra" type="button" id="check-b">Prüfung auswerten</button> <button class="btn ghost" type="button" id="reset-b">Nochmals versuchen</button><div class="score" id="score-b"><div class="nums"><div><b>0</b><span>von … Punkten</span></div><div><b>0 %</b><span>erreicht</span></div><div><b>–</b><span>Note (1 + 5 × Anteil)</span></div></div><div class="meter"><i></i></div><table class="plan"><thead><tr><th>Lernziel</th><th>Punkte</th></tr></thead><tbody>…</tbody></table><p><span>Die Lehrperson kann anders gewichten.</span></p></div></section>
<section class="panel" id="p-c" role="tabpanel" aria-labelledby="t-c"><div class="card" data-ziel="z1"><h2>Z1 · Ich kann …</h2><div class="hint">Merkblock …</div><h3>Beispiel</h3><p>… mit Lösungsweg</p><h3>Üben</h3><div class="field">…</div></div><div class="card"><h2>Lernplan: die letzten drei Tage</h2><table class="plan"><thead><tr><th>Tag</th><th>Lernziele</th><th>Dauer</th><th>Methode</th></tr></thead><tbody>…</tbody></table></div></section>
<details class="lehrperson"><summary>Für die Lehrperson: Lösungen, Punkteschlüssel, typische Fehler</summary><div>…</div></details>
<p class="foot">Prüfungsvorbereitung erzeugt mit Lernwege (EDUTECSOL). Fach · Stufe · Datum.</p>
</div></body>`;

/** Grundgerüst Lernspiel (Klassen aus DESIGN_CSS). */
export const DESIGN_SKELETON_SPIEL = `<body><div class="wrap">
<header class="top"><div><p class="eyebrow">Fach · Stufe · Lernspiel</p><h1>Titel des Spiels</h1><p class="lead">Ein Satz: Was man hier trainiert. Vier Levels, Punkte, Serie.</p></div><div><button class="btn ghost" type="button" id="restart">Neu starten</button> <button class="btn ghost pdf" type="button">Aufgabenliste als PDF</button></div></header>
<div class="hud"><div class="stat"><b id="punkte">0</b><span>Punkte</span></div><div class="stat"><b id="serie">0</b><span>Serie</span></div><div class="stat"><b id="leben">3</b><span>Leben</span></div><div class="stat"><b id="pos">1/7</b><span>Aufgabe</span></div></div>
<div class="meter"><i id="fortschritt"></i></div>
<div class="tabs" role="tablist"><button class="tab active" role="tab" aria-selected="true" aria-controls="p-1" id="t-1" data-level="1"><span class="tname">1 · Erkennen</span><span class="tsub">Auswahl</span></button><button class="tab locked" role="tab" aria-selected="false" aria-controls="p-2" id="t-2" data-level="2"><span class="tname">2 · Erinnern</span><span class="tsub">Eingabe</span></button><button class="tab locked" role="tab" aria-selected="false" aria-controls="p-3" id="t-3" data-level="3"><span class="tname">3 · Anwenden</span><span class="tsub">Zuordnen</span></button><button class="tab locked" role="tab" aria-selected="false" aria-controls="p-4" id="t-4" data-level="4"><span class="tname">4 · Meistern</span><span class="tsub">Reihenfolge, Transfer</span></button></div>
<section class="card" id="stage" aria-live="polite"><p class="eyebrow" id="level-label">Level 1 · Erkennen</p><p class="q" id="frage">…</p><div class="choices grid2" id="antworten">… (Level 1/3/4: .choice-Knöpfe; Level 2: .field mit input; Zuordnen: .pairs; Reihenfolge: .choices.order)</div><div class="next"><span class="feedback" id="feedback"></span><button class="btn terra" type="button" id="weiter" hidden>Weiter</button></div></section>
<div class="score" id="ende"><div class="nums"><div><b id="ende-punkte">0</b><span>Punkte</span></div><div><b id="ende-best">0</b><span>Bestleistung</span></div><div><b id="ende-quote">0 %</b><span>richtig</span></div></div><table><thead><tr><th>Level</th><th>richtig</th><th>falsch</th></tr></thead><tbody id="ende-tabelle"></tbody></table><p><button class="btn terra" type="button" id="nochmals">Nochmals spielen</button></p></div>
<details class="lehrperson"><summary>Für die Lehrperson: alle Aufgaben mit Lösungen, Einsatz im Unterricht</summary><div><table><thead><tr><th>Level</th><th>Aufgabe</th><th>Lösung</th></tr></thead><tbody id="loesungen"></tbody></table><h3>Einsatz</h3><ul class="steps"><li>…</li></ul></div></details>
<p class="foot">Lernspiel erzeugt mit Lernwege (EDUTECSOL). Fach · Stufe · Datum.</p>
</div></body>`;

/** Grundgerüst Lernhilfe (Klassen aus DESIGN_CSS). */
export const DESIGN_SKELETON_HILFE = `<body><div class="wrap">
<header class="top"><div><p class="eyebrow">Fach · Stufe · Lernhilfe</p><h1>Titel: Thema</h1><p class="lead">Ein Satz: Wofür die Lernhilfe dient. Merkblatt, Lernkarten, Glossar.</p></div><button class="btn ghost pdf" type="button">Als PDF drucken</button></header>
<div class="tabs" role="tablist"><button class="tab active" role="tab" aria-selected="true" aria-controls="p-a" id="t-a"><span class="tname">A · Merkblatt</span><span class="tsub">Das Wichtigste auf einer Seite</span></button><button class="tab" role="tab" aria-selected="false" aria-controls="p-b" id="t-b"><span class="tname">B · Lernkarten</span><span class="tsub">… Karten zum Umdrehen</span></button><button class="tab" role="tab" aria-selected="false" aria-controls="p-c" id="t-c"><span class="tname">C · Glossar</span><span class="tsub">… Begriffe, mit Suche</span></button></div>
<section class="panel show" id="p-a" role="tabpanel" aria-labelledby="t-a"><div class="card merk"><h2>Kernaussagen</h2><ol class="steps"><li>…</li></ol><h2>Regeln und Formeln</h2><p><span class="formel">…</span> gilt, wenn …</p><h2>So gehe ich vor</h2><ol class="steps"><li>…</li></ol><div class="hint"><strong>Beispiel:</strong> …</div><h2>Typische Fehler</h2><div class="hint">…</div></div></section>
<section class="panel" id="p-b" role="tabpanel" aria-labelledby="t-b"><div class="hud"><div class="stat"><b id="n-gewusst">0</b><span>gewusst</span></div><div class="stat"><b id="n-nochmals">0</b><span>nochmals</span></div><div class="stat"><b id="n-offen">0</b><span>offen</span></div></div><p class="pick"><button class="btn ghost" type="button" id="mischen">Mischen</button> <button class="btn ghost" type="button" id="nur-nochmals">Nur Nochmals üben</button> <button class="btn ghost" type="button" id="reset-karten">Alle zurücksetzen</button></p><div class="cards" id="karten"><div class="fc" tabindex="0" data-i="0"><div class="in"><div class="f">Frage</div><div class="b">Antwort</div></div></div></div></section>
<section class="panel" id="p-c" role="tabpanel" aria-labelledby="t-c"><div class="card"><input class="search" id="suche" type="text" placeholder="Begriff suchen …" aria-label="Glossar durchsuchen"><dl class="gloss" id="glossar"><dt>Begriff<small>Übersetzung (nur falls zweisprachig)</small></dt><dd>Erklärung in einfacher Sprache. <em>Beispiel:</em> …</dd></dl></div></section>
<details class="lehrperson"><summary>Für die Lehrperson: Einsatz, Abdeckung, Anpassung</summary><div>…</div></details>
<p class="foot">Lernhilfe erzeugt mit Lernwege (EDUTECSOL). Fach · Stufe · Datum.</p>
</div></body>`;

/** Setzt die Designbasis in eine erzeugte Seite ein: in den Platzhalter <style id="lw-basis">, sonst als erstes Element im <head>.
 *  Spart dem Modell rund 6000 Zeichen Ausgabe und garantiert, dass das CSS exakt der Basis entspricht. */
export function injectDesignBasis(html: string): string {
  const block = `<style id="lw-basis">\n${DESIGN_CSS}\n</style>`;
  const re = /<style\s+id=["']lw-basis["'][^>]*>[\s\S]*?<\/style>/i;
  if (re.test(html)) return html.replace(re, block);
  if (html.includes(":root{--paper:#F2F3F5")) return html; // Modell hat das CSS doch selbst ausgegeben
  const i = html.search(/<head[^>]*>/i);
  if (i >= 0) { const j = html.indexOf(">", i) + 1; return html.slice(0, j) + "\n" + block + html.slice(j); }
  return block + html;
}

/** Abschnitt für den System-Prompt. */
export function designBasisPrompt(typ: "lernseite" | "pruefung" | "spiel" | "hilfe" = "lernseite"): string {
  const skeleton = typ === "pruefung" ? DESIGN_SKELETON_PRUEFUNG : typ === "spiel" ? DESIGN_SKELETON_SPIEL : typ === "hilfe" ? DESIGN_SKELETON_HILFE : DESIGN_SKELETON;
  const extra = typ === "pruefung"
    ? `- Timer: Start/Stopp per Knopf, Anzeige mm:ss, nach Ablauf Klasse over (nur Anzeige). Auswertung: Klassen ok/err auf allen Feldern, .loesung je Aufgabe und .score sichtbar (Klasse show), .meter-Breite = Prozent.`
    : typ === "spiel"
      ? `- Spielfläche #stage wird je Aufgabe neu gefüllt; gewählte Option Klasse sel, nach Prüfung ok/err; gelöste Paare Klasse done; Reihenfolge mit data-n; Level-Reiter: locked bis freigeschaltet, done nach Abschluss; am Ende .score mit Klasse show, #stage ausblenden.`
      : typ === "hilfe"
        ? `- Lernkarten: Klick/Enter auf .fc schaltet Klasse flipped; «Gewusst» setzt Klasse known, «Nochmals» Klasse again; Zähler im .hud; Glossar-Suche blendet nicht passende dt/dd-Paare aus (hidden).`
        : `- Der Aha-Moment des obersten Zugangs steht in einem .aha-Block, der erst nach Klick auf einen .btn erscheint.`;
  return `DESIGNBASIS (zwingend):
- Das folgende CSS ist die Designbasis. Gib es NICHT aus: schreibe als erstes Element im <head> nur den Platzhalter <style id="lw-basis">/* Designbasis wird beim Speichern eingesetzt */</style>; die Plattform setzt das CSS dort ein. Ergänze danach ein zweites <style> nur für die themenspezifische Visualisierung und Kleinigkeiten. Keine anderen Farben als die Variablen (--navy, --terra, --ochre, --cream, --ok, --err); keine Schatten, keine Verläufe, keine Emojis als Icons.
<style>
${DESIGN_CSS}
</style>
- Baue die Seite nach diesem Grundgerüst (Klassen beibehalten, Inhalte ersetzen${typ === "lernseite" ? ", Anzahl Zugänge gemäss Auftrag" : ""}):
${skeleton}
- Reiter: Klick setzt .active auf dem Reiter und .show auf dem zugehörigen Panel, aria-selected entsprechend; Pfeiltasten wechseln den Reiter.
- Rückmeldung: richtige Eingabe → Klasse ok auf dem Feld und Text im .feedback (z. B. «Richtig»); falsche → Klasse err und ein Hinweis ohne Lösung. Auswahlaufgaben mit .choices/.choice analog (gewählt = Klasse on).
${extra}`;
}
