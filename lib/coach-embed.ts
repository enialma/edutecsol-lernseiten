// Setzt den Coach-Knopf und das Panel in eine über den Freigabelink ausgelieferte Lernseite ein.
// Heruntergeladene Dateien bleiben unverändert (offline kein Coach).

export const COACH_MARKER = "<!-- lernwege-coach -->";

export function withCoach(html: string, token: string, name: string): string {
  if (html.includes(COACH_MARKER)) return html;
  const safeName = name.replace(/[<>&"']/g, "");
  const generic = safeName.toLowerCase() === "coach";
  const btnLabel = generic ? "Frag den Coach" : `Frag ${safeName}`;
  const headLabel = generic ? "Coach" : `${safeName} · Lerncoach`;
  const ariaLabel = generic ? "Lerncoach" : `Lerncoach ${safeName}`;
  const block = `${COACH_MARKER}
<style id="lw-coach-css">
#lw-coach-bar,#lw-coach-panel{--c-navy:#1E3246;--c-terra:#B84816;--c-ochre:#F1A51A;--c-paper:#F7F8FA;--c-card:#fff;--c-line:#E1E4E8;--c-soft:#5B6572;font-family:"Arial Nova Light","Arial Nova",Arial,system-ui,sans-serif}
#lw-coach-bar{position:fixed;right:18px;bottom:18px;z-index:9998}
#lw-coach-btn{font-family:inherit;font-size:16px;font-weight:600;line-height:1.2;background:var(--c-card);color:var(--c-navy);border:1px solid var(--c-navy);border-radius:10px;padding:13px 18px;min-height:50px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 24px -10px rgba(30,50,70,.45)}
#lw-coach-btn:hover{background:var(--c-paper)}
#lw-coach-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round}
#lw-coach-btn:focus-visible,#lw-coach-close:focus-visible{outline:3px solid var(--c-ochre);outline-offset:2px}
#lw-coach-panel{position:fixed;right:18px;bottom:18px;z-index:9999;width:min(400px,calc(100vw - 36px));height:min(620px,calc(100vh - 36px));background:var(--c-card);color:var(--c-navy);border:1px solid var(--c-line);border-radius:14px;box-shadow:0 24px 60px -20px rgba(30,50,70,.55);display:none;flex-direction:column;overflow:hidden}
#lw-coach-panel.open{display:flex}
#lw-coach-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 12px 20px;border-bottom:1px solid var(--c-line);font-size:16px;font-weight:600}
#lw-coach-head small{display:block;font-weight:400;color:var(--c-soft);font-size:12px;line-height:1.35;margin-top:2px}
#lw-coach-close{flex:none;width:44px;height:44px;border-radius:8px;border:1px solid var(--c-line);background:var(--c-card);color:var(--c-navy);cursor:pointer;display:flex;align-items:center;justify-content:center}
#lw-coach-close:hover{border-color:var(--c-navy)}
#lw-coach-close svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
#lw-coach-frame{flex:1;border:0;width:100%;background:var(--c-card)}
@media (max-width:640px){
  body{padding-bottom:88px!important}
  #lw-coach-bar{left:0;right:0;bottom:0;padding:12px 20px calc(14px + env(safe-area-inset-bottom,0px));background:var(--c-paper);border-top:1px solid var(--c-line)}
  #lw-coach-btn{width:100%;box-shadow:none}
  #lw-coach-panel{left:0;right:0;bottom:0;width:auto;height:min(72vh,560px);border:0;border-radius:18px 18px 0 0;box-shadow:0 -8px 30px rgba(30,50,70,.18)}
}
@media print{#lw-coach-bar,#lw-coach-panel{display:none!important}body{padding-bottom:0!important}}
</style>
<div id="lw-coach-bar"><button id="lw-coach-btn" type="button" aria-haspopup="dialog" aria-controls="lw-coach-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>${btnLabel}</button></div>
<div id="lw-coach-panel" role="dialog" aria-label="${ariaLabel}"><div id="lw-coach-head"><div>${headLabel}<small>Fragt nach, verrät keine Lösung. Nichts wird gespeichert.</small></div><button id="lw-coach-close" type="button" aria-label="Coach schliessen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><iframe id="lw-coach-frame" title="${ariaLabel}"></iframe></div>
<script>
(function(){
  var TOKEN=${JSON.stringify(token)};
  var bar=document.getElementById('lw-coach-bar'),btn=document.getElementById('lw-coach-btn'),panel=document.getElementById('lw-coach-panel'),frame=document.getElementById('lw-coach-frame'),close=document.getElementById('lw-coach-close');
  var lastInput='';
  function txt(el){return el?(el.textContent||'').replace(/\\s+/g,' ').trim():'';}
  function kontext(){
    var tab=document.querySelector('.tab.active .tname')||document.querySelector('.tab.active')||document.querySelector('[role=tab][aria-selected=true]');
    var pnl=document.querySelector('.panel.show')||document.querySelector('[role=tabpanel]:not([hidden])');
    var auf=pnl?(pnl.querySelector('.aufgabe')||pnl.querySelector('.q')||pnl.querySelector('h2')):null;
    return {reiter:txt(tab).slice(0,80),aufgabe:txt(auf).slice(0,400),eingabe:lastInput.slice(0,200)};
  }
  function inExam(){var r=kontext().reiter;return /Übungsprüfung|Uebungspruefung/i.test(r);}
  function updateBtn(){bar.style.display=(inExam()||panel.classList.contains('open'))?'none':'block';}
  function send(){ if(frame.contentWindow) frame.contentWindow.postMessage({type:'lw-kontext',kontext:kontext()},'*'); }
  document.addEventListener('input',function(e){var t=e.target; if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&t.value) lastInput=String(t.value);},true);
  document.addEventListener('click',function(e){ if(e.target&&e.target.closest&&e.target.closest('.tab,[role=tab]')) setTimeout(function(){ if(inExam()) panel.classList.remove('open'); updateBtn(); send(); },50); },true);
  btn.addEventListener('click',function(){
    var k=kontext();
    if(!frame.src){ frame.src='/coach/'+encodeURIComponent(TOKEN)+'?reiter='+encodeURIComponent(k.reiter)+'&aufgabe='+encodeURIComponent(k.aufgabe)+'&eingabe='+encodeURIComponent(k.eingabe); }
    else send();
    panel.classList.add('open'); bar.style.display='none'; close.focus();
  });
  close.addEventListener('click',function(){ panel.classList.remove('open'); updateBtn(); btn.focus(); });
  updateBtn();
})();
</script>
`;
  const i = html.search(/<\/body>/i);
  if (i >= 0) return html.slice(0, i) + block + html.slice(i);
  return html + block;
}
