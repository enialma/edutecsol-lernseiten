// Werkzeug-Seiten: Wahlknöpfe melden ihren Zustand (Klasse «on») als aria-pressed an Screenreader.
// Die Seitenskripte setzen nur die Klasse; hier wird aria-pressed nachgeführt, ohne deren Logik anzufassen.
(() => {
  const isChoice = (b) => b.closest(".seg") && (b.dataset.v !== undefined || b.dataset.e !== undefined);
  const sync = (b) => { if (isChoice(b)) b.setAttribute("aria-pressed", b.classList.contains("on") ? "true" : "false"); };
  const all = () => document.querySelectorAll(".seg button").forEach((b) => { if (!b.type || b.getAttribute("type") === null) b.type = "button"; sync(b); });
  all();
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === "attributes" && m.target.matches && m.target.matches(".seg button")) sync(m.target);
      else if (m.type === "childList") all();
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
})();
