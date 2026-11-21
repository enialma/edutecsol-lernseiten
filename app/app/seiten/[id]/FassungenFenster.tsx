"use client";
import { useRef } from "react";

/** Knopf «Fassungen (n)» und kleines Fenster mit allen Fassungen (Liste kommt vom Server als children). */
export default function FassungenFenster({ anzahl, children }: { anzahl: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const zu = () => ref.current?.close();
  return (
    <>
      <button type="button" className="btn ghost" aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        Fassungen ({anzahl})
      </button>
      {/* Klick neben das Fenster (auf den abgedunkelten Hintergrund) schliesst es, Esc ebenso */}
      <dialog ref={ref} className="nb-dialog" aria-labelledby="nb-dialog-h" onClick={(e) => e.target === ref.current && zu()}>
        <div className="nb-dialog-in">
          <div className="nb-dialog-head">
            <h3 id="nb-dialog-h">Fassungen, neueste zuerst</h3>
            <button type="button" className="nb-dialog-x" aria-label="Schliessen" onClick={zu}>×</button>
          </div>
          <p className="small-note">«Ansehen» öffnet die Fassung in einem neuen Tab, «Verwenden» macht sie wieder zur aktuellen Seite.</p>
          {/* Nach «Verwenden» schliessen, die Detailseite lädt dann die neue Fassung */}
          <div className="nb-fassungen" onSubmit={() => setTimeout(zu, 0)}>{children}</div>
        </div>
      </dialog>
    </>
  );
}
