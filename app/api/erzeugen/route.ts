// Erzeugt eine Lernseite: Material extrahieren → Prompt bauen → KI streamen → in DB speichern.
// Antwort ist ein Textstream: Fortschrittszeilen, am Ende eine Zeile "@@DONE {json}" oder "@@ERROR text".
import { auth } from "@/auth";
import { generate, PROVIDER_LABELS, providersFor, type Provider } from "@/lib/ai";
import { isSwissOnly } from "@/lib/users";
import { extractFromFile, type Extracted } from "@/lib/extract";
import { createPage } from "@/lib/pages";
import { LIMITS, logGeneration, quotaFor } from "@/lib/quota";
import { extractHtml, systemPrompt, titleFromHtml, userPrompt, type GenParams } from "@/lib/prompt";
import { injectDesignBasis } from "@/lib/design-basis";
import { DIFFART_WAHL, MAX_EIGEN_LEN, MAX_EIGENE, SOZIALFORMEN, zugangOptionen, type Sozialform } from "@/lib/achsen";
import { TASKS, type Einsatz } from "@/lib/bildprompt";
import { getImageMeta, setImageShare } from "@/lib/images";

export const runtime = "nodejs";
// Vercel Pro mit Fluid Compute erlaubt bis 800 s; wir nutzen 600 s und brechen selbst 20 s vorher ab.
export const maxDuration = 600;
const TIME_BUDGET_MS = 580_000;
export const dynamic = "force-dynamic";

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(String(v)) ? (v as T) : fallback;
}

/** Mehrfachwert aus dem Formular (JSON-Array von Strings); Ungültiges ergibt eine leere Liste. */
function list(v: unknown): string[] {
  try {
    const a = JSON.parse(String(v ?? "[]"));
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const userId = Number(session.user.id);

  const fd = await req.formData();
  const swissOnly = await isSwissOnly(userId);
  const allowed = providersFor(swissOnly);
  const provider = pick<Provider>(fd.get("provider"), allowed, allowed[0]);
  if (!provider) return new Response(swissOnly ? "Deine Schule nutzt nur KI mit Standort Schweiz, und Infomaniak ist gerade nicht eingerichtet." : "Kein KI-Anbieter konfiguriert.", { status: 503 });
  // Nur Admins dürfen das Modell übersteuern (Modelltests); leer = Standard des Anbieters
  const modellOverride = session.user.role === "admin" ? String(fd.get("modell") ?? "").trim().slice(0, 120) : "";

  const quota = (await quotaFor(userId, session.user.role === "admin"))[provider];
  if (quota.limit !== null && quota.used >= quota.limit) {
    const other = provider === "claude" && allowed.includes("infomaniak") ? " Mit Infomaniak kannst du weiter erzeugen." : "";
    return new Response(`Dein Monatskontingent von ${LIMITS[provider]} Lernseiten mit ${PROVIDER_LABELS[provider]} ist aufgebraucht. Am Monatsersten wird es zurückgesetzt.${other}`, { status: 429 });
  }

  const params: GenParams = {
    typ: pick(fd.get("typ"), ["lernseite", "arbeitsblatt", "pruefung", "spiel", "hilfe"] as const, "lernseite"),
    dauer: (Number(fd.get("dauer")) === 20 ? 20 : Number(fd.get("dauer")) === 45 ? 45 : 30) as 20 | 30 | 45,
    fach: String(fd.get("fach") ?? "").trim(),
    stufe: String(fd.get("stufe") ?? "").trim(),
    thema: String(fd.get("thema") ?? "").trim(),
    extra: String(fd.get("extra") ?? "").trim(),
    diffart: pick(fd.get("diffart"), DIFFART_WAHL, "niveau"),
    sprache: pick(fd.get("sprache"), ["standard", "einfach", "glossar", "zweisprachig"] as const, "standard"),
    zweitsprache: String(fd.get("zweitsprache") ?? "").trim(),
    twist: pick(fd.get("twist"), ["auto", "ausreisser", "vergleich", "grenzfall", "fehler", "methoden", "transfer"] as const, "auto"),
    niveau: pick(fd.get("niveau"), ["reproduzieren", "anwenden", "beurteilen"] as const, "anwenden"),
  };
  if (!params.fach || !params.stufe) return new Response("Fach und Zielstufe sind Pflicht.", { status: 400 });

  // Achsen und Feinsteuerung, nur für Lernseiten: Zugänge, eigene Berufsfelder, Sozialformen, Aufgabenanzahl, Aufgabenvorgaben, LaTeX
  if (params.typ === "lernseite" || params.typ === "arbeitsblatt") {
    const diffart = params.diffart as (typeof DIFFART_WAHL)[number];
    if (diffart === "interesse") {
      const eigene: string[] = [];
      for (const raw of list(fd.get("eigeneBerufsfelder"))) {
        const name = raw.trim();
        if (!name || eigene.some((e) => e.toLowerCase() === name.toLowerCase())) continue;
        if (name.length > MAX_EIGEN_LEN) return new Response(`Eigenes Berufsfeld zu lang (max. ${MAX_EIGEN_LEN} Zeichen): «${name.slice(0, 30)}…»`, { status: 400 });
        eigene.push(name);
      }
      if (eigene.length > MAX_EIGENE) return new Response(`Höchstens ${MAX_EIGENE} eigene Berufsfelder.`, { status: 400 });
      if (eigene.length) params.eigeneBerufsfelder = eigene;
    }
    // Nur Zugänge, die zur Differenzierungsart passen, in Skalen-Reihenfolge
    const gewaehlt = list(fd.get("zugaenge"));
    const zugaenge = zugangOptionen(diffart, params.eigeneBerufsfelder).map((o) => o.v).filter((v) => gewaehlt.includes(v));
    if (!zugaenge.length) return new Response("Bitte mindestens einen Zugang wählen.", { status: 400 });
    params.zugaenge = zugaenge;
    const sozial = list(fd.get("sozialformen"));
    const sozialformen = SOZIALFORMEN.map((o) => o.v).filter((v): v is Sozialform => sozial.includes(v));
    if (!sozialformen.length) return new Response("Bitte mindestens eine Sozialform wählen.", { status: 400 });
    params.sozialformen = sozialformen;

    const anzahlRaw = String(fd.get("aufgaben") ?? "").trim();
    if (anzahlRaw) {
      const n = Number(anzahlRaw);
      if (!Number.isInteger(n) || n < 1 || n > 12) return new Response("Anzahl Aufgaben: bitte eine ganze Zahl von 1 bis 12 oder leer lassen.", { status: 400 });
      params.aufgaben = n;
    }
    const aufgabenText = String(fd.get("aufgabenText") ?? "").trim();
    if (aufgabenText.length > 2000) return new Response("Die Aufgabenbeschreibung ist zu lang (max. 2 000 Zeichen).", { status: 400 });
    if (aufgabenText) params.aufgabenText = aufgabenText;
    if (fd.get("latex") === "true") params.latex = true;
  }

  // Optional: eigenes Bild als Bildaufgabe einbinden (braucht einen öffentlichen Bildlink)
  const bildId = Number(fd.get("bild") ?? 0);
  if (bildId > 0) {
    const isAdmin = session.user.role === "admin";
    const img = await getImageMeta(bildId, userId, isAdmin);
    if (!img) return new Response("Das gewählte Bild wurde nicht gefunden.", { status: 400 });
    const token = img.share_token ?? (img.user_id === userId || isAdmin ? await setImageShare(img.id, userId, isAdmin, true) : null);
    if (!token) return new Response("Für fremde Bilder zuerst «In meine Sammlung kopieren».", { status: 400 });
    const origin = `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host") ?? req.headers.get("host")}`;
    const e = (img.einsatz ?? "beschreiben") as Einsatz;
    params.bild = { id: img.id, url: `${origin}/b/${token}`, title: img.title, auftrag: TASKS[e] ?? TASKS.beschreiben, alt: `KI-generierte Illustration: ${img.title}` };
  }

  const file = fd.get("datei");
  const materialText = String(fd.get("material") ?? "").trim();

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => controller.enqueue(enc.encode(s));
      const t0 = Date.now();
      let spent: { provider: string; model?: string | null; inputTokens: number; outputTokens: number } | null = null;
      try {
        let material: Extracted | null = null;
        if (file instanceof File && file.size > 0) {
          send(`▸ Lese «${file.name}» …\n`);
          material = await extractFromFile(file);
          send(`▸ ${material.text.length.toLocaleString("de-CH")} Zeichen Text ausgelesen${material.truncated ? " (gekürzt)" : ""}.\n`);
        } else if (materialText) {
          material = { name: "", text: materialText, truncated: false, kind: "text" };
        }

        send(`▸ ${params.typ === "pruefung" ? "Prüfungsvorbereitung" : params.typ === "spiel" ? "Lernspiel" : params.typ === "hilfe" ? "Lernhilfe" : params.typ === "arbeitsblatt" ? "Arbeitsblatt" : "Lernseite"} wird mit ${PROVIDER_LABELS[provider]}${modellOverride ? ` (${modellOverride})` : ""} erzeugt – das dauert ein bis drei Minuten …\n`);
        let chars = 0;
        let lastTick = Date.now();
        const tStart = Date.now();
        // Vercel bricht nach maxDuration hart ab; wir brechen vorher selbst ab, damit eine klare Meldung ankommt.
        const budget = new AbortController();
        const budgetTimer = setTimeout(() => budget.abort(), TIME_BUDGET_MS);
        const result = await generate(provider, {
          system: systemPrompt(params.typ),
          user: userPrompt(params, material ? { name: material.name, text: material.text } : null),
          onDelta: (chunk) => {
            chars += chunk.length;
            if (Date.now() - lastTick > 2500) {
              lastTick = Date.now();
              const secs = Math.max(1, Math.round((Date.now() - tStart) / 1000));
              send(`  … ${chars.toLocaleString("de-CH")} Zeichen nach ${secs} s (${Math.round(chars / secs)} Zeichen/s)\n`);
            }
          },
          signal: AbortSignal.any([req.signal, budget.signal]),
          model: modellOverride || undefined,
        }).catch((e) => {
          if (budget.signal.aborted) {
            const secs = Math.max(1, Math.round((Date.now() - tStart) / 1000));
            throw new Error(`Das Modell ist zu langsam: nach ${secs} s erst ${chars.toLocaleString("de-CH")} Zeichen (${Math.round(chars / secs)} Zeichen/s). Bitte den anderen Anbieter wählen oder das Thema enger fassen.`);
          }
          throw e;
        }).finally(() => clearTimeout(budgetTimer));

        spent = result;
        if (result.stopReason === "refusal") throw new Error("Das Modell hat die Anfrage abgelehnt.");
        const html = injectDesignBasis(extractHtml(result.text));
        if (!/<html[\s>]/i.test(html) || !/<\/html>/i.test(html)) {
          throw new Error(result.stopReason === "max_tokens" ? "Antwort wurde abgeschnitten (zu lang). Bitte Thema enger fassen." : "Antwort enthielt keine vollständige HTML-Seite.");
        }
        const notiz = html.match(/<!--\s*NOTIZ:\s*([\s\S]*?)-->/i)?.[1]?.trim() ?? null;
        const title = titleFromHtml(html, params.thema || params.fach);
        const id = await createPage({
          userId, title, fach: params.fach, stufe: params.stufe, thema: params.thema, params,
          materialName: material?.name || null, provider: result.provider, model: result.model,
          inputTokens: result.inputTokens, outputTokens: result.outputTokens, durationMs: Date.now() - t0, html, notiz,
        });
        await logGeneration({ userId, ...result, ok: true });
        spent = null;
        send(`▸ Fertig: «${title}» (${Math.round((Date.now() - t0) / 1000)} s, ${result.outputTokens.toLocaleString("de-CH")} Tokens).\n`);
        send(`@@DONE ${JSON.stringify({ id, title })}\n`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("erzeugen fehlgeschlagen", e);
        // Kosten sind angefallen, die Seite ist aber unbrauchbar: protokollieren, ohne das Kontingent zu belasten
        if (spent) await logGeneration({ userId, ...spent, ok: false }).catch(() => {});
        send(`@@ERROR ${msg}\n`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
