// Bessert eine bestehende Lernseite nach einem Auftrag der Lehrperson nach: Seite + Auftrag → KI liefert Ersetzungsblöcke →
// einsetzen und prüfen → speichern (alte Fassung für «Rückgängig»). Gleiche KI wie beim Erzeugen, kein Kontingent.
// Antwort ist ein Textstream wie bei /api/erzeugen: Fortschrittszeilen, am Ende "@@DONE {json}" oder "@@ERROR text".
import { auth } from "@/auth";
import { generate, PROVIDER_LABELS, providersFor, type GenResult, type Provider } from "@/lib/ai";
import { isSwissOnly } from "@/lib/users";
import { getPage, saveNachbesserung } from "@/lib/pages";
import { logGeneration } from "@/lib/quota";
import { MAX_AUFTRAG, NACHBESSERN_SYSTEM, einsetzen, nachbessernRetryUser, nachbessernUser, parseAntwort, pruefeErgebnis } from "@/lib/nachbessern";

export const runtime = "nodejs";
export const maxDuration = 600;
const TIME_BUDGET_MS = 580_000;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const userId = Number(session.user.id);
  const isAdmin = session.user.role === "admin";

  const body = (await req.json().catch(() => ({}))) as { id?: unknown; auftrag?: unknown };
  const id = Number(body.id);
  const auftrag = String(body.auftrag ?? "").trim();
  if (!auftrag) return new Response("Bitte beschreibe, was an der Seite geändert werden soll.", { status: 400 });
  if (auftrag.length > MAX_AUFTRAG) return new Response(`Der Auftrag ist zu lang (höchstens ${MAX_AUFTRAG.toLocaleString("de-CH")} Zeichen).`, { status: 400 });

  const page = Number.isInteger(id) ? await getPage(id, userId, isAdmin) : null;
  if (!page) return new Response("Seite nicht gefunden.", { status: 404 });
  if (page.user_id !== userId && !isAdmin) return new Response("Nur eigene Seiten lassen sich nachbessern. Kopiere die Seite zuerst in deine Sammlung.", { status: 403 });

  // Dieselbe KI wie beim Erzeugen; im Schulmodus «KI nur Schweiz» oder wenn sie nicht eingerichtet ist, die erste erlaubte
  const allowed = providersFor(await isSwissOnly(userId));
  const original = page.provider as Provider;
  const provider = allowed.includes(original) ? original : allowed[0];
  if (!provider) return new Response("Kein passender KI-Anbieter eingerichtet.", { status: 503 });

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => controller.enqueue(enc.encode(s));
      const t0 = Date.now();
      const spent = { inputTokens: 0, outputTokens: 0, model: "" };
      const budget = new AbortController();
      const budgetTimer = setTimeout(() => budget.abort(), TIME_BUDGET_MS);
      const html = page.html;

      async function rufen(user: string): Promise<GenResult> {
        let chars = 0;
        let lastTick = Date.now();
        const r = await generate(provider, {
          system: NACHBESSERN_SYSTEM,
          user,
          onDelta: (chunk) => {
            chars += chunk.length;
            if (Date.now() - lastTick > 2500) {
              lastTick = Date.now();
              send(`  … ${chars.toLocaleString("de-CH")} Zeichen nach ${Math.round((Date.now() - t0) / 1000)} s\n`);
            }
          },
          signal: AbortSignal.any([req.signal, budget.signal]),
        }).catch((e) => {
          if (budget.signal.aborted) throw new Error("Das Nachbessern hat zu lange gedauert. Bitte den Auftrag kürzer oder enger fassen.");
          throw e;
        });
        spent.inputTokens += r.inputTokens;
        spent.outputTokens += r.outputTokens;
        spent.model = r.model;
        if (r.stopReason === "refusal") throw new Error("Das Modell hat den Auftrag abgelehnt.");
        if (r.stopReason === "max_tokens") throw new Error("Die Antwort wurde abgeschnitten. Bitte den Auftrag in kleinere Schritte aufteilen.");
        return r;
      }

      try {
        const wie = provider === original ? "wie beim Erzeugen"
          : original in PROVIDER_LABELS ? `${PROVIDER_LABELS[original]} ist hier nicht verfügbar` : "die Seite hat keine eigene KI";
        send(`▸ Seite wird mit ${PROVIDER_LABELS[provider]} nachgebessert (${wie}) – das dauert meist unter einer Minute …\n`);

        let r = await rufen(nachbessernUser(html, auftrag));
        let antwort = parseAntwort(r.text);
        if (!antwort.bloecke.length) {
          throw new Error(antwort.abgelehnt ? `Die KI hat den Auftrag nicht umgesetzt: ${antwort.abgelehnt}` : "Die KI hat keine Änderungen geliefert. Bitte den Auftrag genauer formulieren.");
        }
        let ergebnis = einsetzen(html, antwort.bloecke);
        if ("probleme" in ergebnis) {
          send(`▸ ${ergebnis.probleme.length} von ${antwort.bloecke.length} Änderungen passten nicht genau, zweiter Versuch …\n`);
          r = await rufen(nachbessernRetryUser(html, auftrag, r.text, ergebnis.probleme));
          antwort = parseAntwort(r.text);
          ergebnis = antwort.bloecke.length ? einsetzen(html, antwort.bloecke) : { probleme: ["keine Blöcke"] };
          if ("probleme" in ergebnis) throw new Error("Die Änderungen liessen sich nicht sicher in die Seite einsetzen. Die Seite ist unverändert. Bitte den Auftrag anders oder in kleineren Schritten formulieren.");
        }
        const fehler = pruefeErgebnis(html, ergebnis.html);
        if (fehler) throw new Error(`${fehler} Die Seite ist unverändert.`);

        const ok = await saveNachbesserung({
          id: page.id, altHtml: html, neuHtml: ergebnis.html, auftrag, provider, model: spent.model,
          inputTokens: spent.inputTokens, outputTokens: spent.outputTokens,
        });
        if (!ok) throw new Error("Die Seite wurde in der Zwischenzeit geändert. Bitte nochmals nachbessern.");
        await logGeneration({ userId, provider, model: spent.model, inputTokens: spent.inputTokens, outputTokens: spent.outputTokens, ok: true, nachbessern: true });
        spent.inputTokens = spent.outputTokens = 0;
        const n = antwort.bloecke.length;
        send(`▸ Fertig: ${n} ${n === 1 ? "Änderung" : "Änderungen"} eingesetzt (${Math.round((Date.now() - t0) / 1000)} s).\n`);
        send(`@@DONE ${JSON.stringify({ id: page.id, aenderungen: n, notiz: antwort.notiz })}\n`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("nachbessern fehlgeschlagen", e);
        // Kosten protokollieren, auch wenn nichts gespeichert wurde
        if (spent.inputTokens || spent.outputTokens) await logGeneration({ userId, provider, ...spent, ok: false, nachbessern: true }).catch(() => {});
        send(`@@ERROR ${msg}\n`);
      } finally {
        clearTimeout(budgetTimer);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
