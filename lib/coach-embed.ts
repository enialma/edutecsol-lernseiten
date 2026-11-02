// Setzt den Coach-Knopf und das Panel in eine über den Freigabelink ausgelieferte Lernseite ein.
// Heruntergeladene Dateien bleiben unverändert (offline kein Coach).

export const COACH_MARKER = "<!-- lernwege-coach -->";

export function withCoach(html: string, token: string, name: string): string {
  if (html.includes(COACH_MARKER)) return html;
  const safeName = name.replace(/[<>&"']/g, "");
  const generic = safeName.toLowerCase() === "coach";
  const btnLabel = generic ? "Frag den Coach" : `Frag ${safeName}`;
  const headLabel = generic ? "Dein Lerncoach" : `${safeName} · Lerncoach`;
  const ariaLabel = generic ? "Lerncoach" : `Lerncoach ${safeName}`;
  const block = `${COACH_MARKER}
<style id="lw-coach-css">
#lw-coach-btn{position:fixed;right:18px;bottom:18px;z-index:9998;font:600 15px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#B84816;color:#fff;border:0;border-radius:999px;padding:12px 18px 12px 14px;cursor:pointer;box-shadow:0 10px 24px -8px rgba(30,50,70,.5);display:inline-flex;align-items:center;gap:8px}
#lw-coach-btn:hover{background:#9A3A10}
#lw-coach-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#lw-coach-panel{position:fixed;right:18px;bottom:18px;z-index:9999;width:min(400px,calc(100vw - 36px));height:min(620px,calc(100vh - 36px));background:#fff;border:1px solid #C9CED5;border-radius:14px;box-shadow:0 24px 60px -20px rgba(30,50,70,.55);display:none;flex-direction:column;overflow:hidden}
#lw-coach-panel.open{display:flex}
#lw-coach-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px 10px 16px;background:#1E3246;color:#fff;font:600 14px system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
#lw-coach-head small{display:block;font-weight:400;color:#C3CCD6;font-size:12px}
#lw-coach-close{background:transparent;border:0;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:6px}
#lw-coach-close:hover{background:rgba(255,255,255,.12)}
#lw-coach-frame{flex:1;border:0;width:100%;background:#F2F3F5}
@media print{#lw-coach-btn,#lw-coach-panel{display:none!important}}
</style>
<button id="lw-coach-btn" type="button" aria-haspopup="dialog" aria-controls="lw-coach-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>${btnLabel}</button>
<div id="lw-coach-panel" role="dialog" aria-label="${ariaLabel}"><div id="lw-coach-head"><div>${headLabel}<small>Fragt nach, verrät nichts. Nichts wird gespeichert.</small></div><button id="lw-coach-close" type="button" aria-label="Schliessen">×</button></div><iframe id="lw-coach-frame" title="${ariaLabel}"></iframe></div>
<script>
(function(){
  var TOKEN=${JSON.stringify(token)};
  var btn=document.getElementById('lw-coach-btn'),panel=document.getElementById('lw-coach-panel'),frame=document.getElementById('lw-coach-frame'),close=document.getElementById('lw-coach-close');
  var lastInput='';
  function txt(el){return el?(el.textContent||'').replace(/\\s+/g,' ').trim():'';}
  function kontext(){
    var tab=document.querySelector('.tab.active .tname')||document.querySelector('.tab.active')||document.querySelector('[role=tab][aria-selected=true]');
    var pnl=document.querySelector('.panel.show')||document.querySelector('[role=tabpanel]:not([hidden])');
    var auf=pnl?(pnl.querySelector('.aufgabe')||pnl.querySelector('.q')||pnl.querySelector('h2')):null;
    return {reiter:txt(tab).slice(0,80),aufgabe:txt(auf).slice(0,400),eingabe:lastInput.slice(0,200)};
  }
  function inExam(){var r=kontext().reiter;return /Übungsprüfung|Uebungspruefung/i.test(r);}
  function updateBtn(){btn.style.display=(inExam()||panel.classList.contains('open'))?'none':'inline-flex';}
  function send(){ if(frame.contentWindow) frame.contentWindow.postMessage({type:'lw-kontext',kontext:kontext()},'*'); }
  document.addEventListener('input',function(e){var t=e.target; if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&t.value) lastInput=String(t.value);},true);
  document.addEventListener('click',function(e){ if(e.target&&e.target.closest&&e.target.closest('.tab,[role=tab]')) setTimeout(function(){ if(inExam()) panel.classList.remove('open'); updateBtn(); send(); },50); },true);
  btn.addEventListener('click',function(){
    var k=kontext();
    if(!frame.src){ frame.src='/coach/'+encodeURIComponent(TOKEN)+'?reiter='+encodeURIComponent(k.reiter)+'&aufgabe='+encodeURIComponent(k.aufgabe)+'&eingabe='+encodeURIComponent(k.eingabe); }
    else send();
    panel.classList.add('open'); btn.style.display='none';
  });
  close.addEventListener('click',function(){ panel.classList.remove('open'); updateBtn(); });
  updateBtn();
})();
</script>
`;
  const i = html.search(/<\/body>/i);
  if (i >= 0) return html.slice(0, i) + block + html.slice(i);
  return html + block;
}
