// Designbasis für erzeugte Lernseiten (Etappe 4 der Design-Modernisierung, Oktober 2026).
// Das Modell übernimmt dieses CSS unverändert als erstes <style>-Element und baut die Seite nach dem Grundgerüst.
// Offline-tauglich: keine Webfonts, keine externen Dateien. Schriften: Serife für Titel (Georgia-Stapel), Sans für Text.
// Farben wie die Plattform lernwege.edutecsol.ch: Navy, Terra, Ocker, Creme.

export const DESIGN_CSS = `:root{--paper:#FBF8F1;--card:#FFFFFF;--ink:#1E3246;--ink-soft:#5B6572;--line:#E2DBCB;--line-strong:#CDC4AD;--navy:#1E3246;--terra:#B84816;--terra-deep:#9A3A10;--ochre:#F1A51A;--cream:#F6EFE2;--ok:#2F8F6F;--ok-soft:#DFF3EA;--err:#B8321A;--err-soft:#FBE6E1;--serif:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif;--sans:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;--r:8px;--r-lg:12px}
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
.sr{position:absolute;left:-9999px}`;

/** Grundgerüst, an das sich die erzeugte Seite hält (Klassen aus DESIGN_CSS). */
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

/** Abschnitt für den System-Prompt. */
export function designBasisPrompt(): string {
  return `DESIGNBASIS (zwingend):
- Übernimm dieses CSS unverändert als erstes <style>-Element im <head>; ergänze danach ein zweites <style> nur für die themenspezifische Visualisierung und Kleinigkeiten. Keine anderen Farben als die Variablen (--navy, --terra, --ochre, --cream, --ok, --err); keine Schatten, keine Verläufe, keine Emojis als Icons.
<style>
${DESIGN_CSS}
</style>
- Baue die Seite nach diesem Grundgerüst (Klassen beibehalten, Inhalte ersetzen, Anzahl Zugänge gemäss Auftrag):
${DESIGN_SKELETON}
- Reiter: Klick setzt .active auf dem Reiter und .show auf dem zugehörigen Panel, aria-selected entsprechend; Pfeiltasten wechseln den Reiter.
- Rückmeldung: richtige Eingabe → Klasse ok auf dem Feld und Text im .feedback (z. B. «Richtig»); falsche → Klasse err und ein Hinweis ohne Lösung. Auswahlaufgaben mit .choices/.choice analog.
- Der Aha-Moment des obersten Zugangs steht in einem .aha-Block, der erst nach Klick auf einen .btn erscheint.`;
}
