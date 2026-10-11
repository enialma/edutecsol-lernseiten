// Erzeugt ein Bild für eine Lernaufgabe (JSON {state, provider, quality}) oder bessert ein bestehendes nach
// (JSON {parentId, instruction, quality}). Antwort: {id, title} oder Fehlertext.
import { auth } from "@/auth";
import { normalize, promptForModel, titleFor, type BildState } from "@/lib/bildprompt";
import { availableImageProviders, editImage, generateImage, type ImageProvider, type Quality } from "@/lib/imagegen";
import { createImage, getImage } from "@/lib/images";
import { imageQuotaFor, LIMIT_BILDER, logGeneration } from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const userId = Number(session.user.id);
  const isAdmin = session.user.role === "admin";

  const providers = availableImageProviders();
  if (providers.length === 0) return new Response("Kein Bilddienst konfiguriert (OPENAI_API_KEY fehlt).", { status: 503 });

  let body: { state?: unknown; provider?: string; quality?: string; parentId?: number; instruction?: string };
  try { body = await req.json(); } catch { return new Response("Ungültige Anfrage.", { status: 400 }); }

  const quota = await imageQuotaFor(userId, isAdmin);
  if (quota.limit !== null && quota.used >= quota.limit) {
    return new Response(`Dein Monatskontingent von ${LIMIT_BILDER} Bildern ist aufgebraucht. Am Monatsersten wird es zurückgesetzt.`, { status: 429 });
  }
  const quality: Quality = body.quality === "high" ? "high" : "medium";
  const t0 = Date.now();
  let spent: { model: string; inputTokens: number; outputTokens: number } | null = null;

  try {
    if (body.parentId) {
      // Nachbessern
      const parent = await getImage(Number(body.parentId), userId, isAdmin);
      if (!parent) return new Response("Ausgangsbild nicht gefunden.", { status: 404 });
      const instruction = String(body.instruction ?? "").trim().slice(0, 1000);
      if (!instruction) return new Response("Änderungsauftrag fehlt.", { status: 400 });
      const r = await editImage({
        b64: parent.data_b64, mime: parent.mime, instruction, context: parent.prompt,
        size: parent.size || "1536x1024", quality, signal: req.signal,
      });
      spent = r;
      const id = await createImage({
        userId, title: parent.title, einsatz: parent.einsatz, thema: parent.thema, params: parent.params, prompt: parent.prompt,
        instruction, parentId: parent.parent_id ?? parent.id, provider: r.provider, model: r.model, size: r.size, quality,
        inputTokens: r.inputTokens, outputTokens: r.outputTokens, durationMs: Date.now() - t0, mime: r.mime, dataB64: r.b64,
      });
      await logGeneration({ userId, provider: "bild", model: `${r.provider}/${r.model}`, inputTokens: r.inputTokens, outputTokens: r.outputTokens, ok: true });
      return Response.json({ id, title: parent.title });
    }

    const state: BildState = normalize(body.state);
    if (!state.motiv.trim() && !state.handlung.trim() && !state.umgebung.trim()) {
      return new Response("Beschreibe mindestens Motiv, Handlung oder Umgebung.", { status: 400 });
    }
    const provider: ImageProvider = providers.includes(body.provider as ImageProvider) ? (body.provider as ImageProvider) : providers[0];
    const prompt = promptForModel(state);
    const r = await generateImage({ provider, prompt, format: state.format, quality, signal: req.signal });
    spent = r;
    const title = titleFor(state);
    const id = await createImage({
      userId, title, einsatz: state.e, thema: state.thema || null, params: state, prompt,
      provider: r.provider, model: r.model, size: r.size, quality,
      inputTokens: r.inputTokens, outputTokens: r.outputTokens, durationMs: Date.now() - t0, mime: r.mime, dataB64: r.b64,
    });
    await logGeneration({ userId, provider: "bild", model: `${r.provider}/${r.model}`, inputTokens: r.inputTokens, outputTokens: r.outputTokens, ok: true });
    return Response.json({ id, title });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("bild erzeugen fehlgeschlagen", e);
    if (spent) await logGeneration({ userId, provider: "bild", model: spent.model, inputTokens: spent.inputTokens, outputTokens: spent.outputTokens, ok: false }).catch(() => {});
    return new Response(msg, { status: 500 });
  }
}
