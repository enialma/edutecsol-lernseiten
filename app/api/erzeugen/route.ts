// Erzeugt eine Lernseite: Material extrahieren → Prompt bauen → KI streamen → in DB speichern.
// Antwort ist ein Textstream: Fortschrittszeilen, am Ende eine Zeile "@@DONE {json}" oder "@@ERROR text".
import { auth } from "@/auth";
import { availableProviders, generate, type Provider } from "@/lib/ai";
import { extractFromFile, type Extracted } from "@/lib/extract";
import { createPage } from "@/lib/pages";
import { extractHtml, systemPrompt, titleFromHtml, userPrompt, type GenParams } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(String(v)) ? (v as T) : fallback;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const userId = Number(session.user.id);

  const fd = await req.formData();
  const provider = pick<Provider>(fd.get("provider"), availableProviders(), availableProviders()[0]);
  if (!provider) return new Response("Kein KI-Anbieter konfiguriert.", { status: 503 });

  const params: GenParams = {
    fach: String(fd.get("fach") ?? "").trim(),
    stufe: String(fd.get("stufe") ?? "").trim(),
    thema: String(fd.get("thema") ?? "").trim(),
    extra: String(fd.get("extra") ?? "").trim(),
    diffart: pick(fd.get("diffart"), ["niveau", "lerntyp", "interesse", "sozialform"] as const, "niveau"),
    anzahl: (Number(fd.get("anzahl")) === 2 ? 2 : Number(fd.get("anzahl")) === 4 ? 4 : 3) as 2 | 3 | 4,
    sprache: pick(fd.get("sprache"), ["standard", "einfach", "glossar", "zweisprachig"] as const, "standard"),
    zweitsprache: String(fd.get("zweitsprache") ?? "").trim(),
    twist: pick(fd.get("twist"), ["auto", "ausreisser", "vergleich", "grenzfall", "fehler", "methoden", "transfer"] as const, "auto"),
    niveau: pick(fd.get("niveau"), ["reproduzieren", "anwenden", "beurteilen"] as const, "anwenden"),
  };
  if (!params.fach || !params.stufe) return new Response("Fach und Zielstufe sind Pflicht.", { status: 400 });

  const file = fd.get("datei");
  const materialText = String(fd.get("material") ?? "").trim();

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => controller.enqueue(enc.encode(s));
      const t0 = Date.now();
      try {
        let material: Extracted | null = null;
        if (file instanceof File && file.size > 0) {
          send(`▸ Lese «${file.name}» …\n`);
          material = await extractFromFile(file);
          send(`▸ ${material.text.length.toLocaleString("de-CH")} Zeichen Text ausgelesen${material.truncated ? " (gekürzt)" : ""}.\n`);
        } else if (materialText) {
          material = { name: "", text: materialText, truncated: false, kind: "text" };
        }

        send(`▸ Lernseite wird mit ${provider === "claude" ? "Claude" : "Infomaniak"} erzeugt – das dauert ein bis drei Minuten …\n`);
        let chars = 0;
        let lastTick = Date.now();
        const result = await generate(provider, {
          system: systemPrompt(),
          user: userPrompt(params, material ? { name: material.name, text: material.text } : null),
          onDelta: (chunk) => {
            chars += chunk.length;
            if (Date.now() - lastTick > 2500) {
              lastTick = Date.now();
              send(`  … ${chars.toLocaleString("de-CH")} Zeichen\n`);
            }
          },
          signal: req.signal,
        });

        if (result.stopReason === "refusal") throw new Error("Das Modell hat die Anfrage abgelehnt.");
        const html = extractHtml(result.text);
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
        send(`▸ Fertig: «${title}» (${Math.round((Date.now() - t0) / 1000)} s, ${result.outputTokens.toLocaleString("de-CH")} Tokens).\n`);
        send(`@@DONE ${JSON.stringify({ id, title })}\n`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("erzeugen fehlgeschlagen", e);
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
