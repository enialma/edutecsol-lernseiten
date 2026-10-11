// Bilddienste für «Bild direkt erzeugen»: OpenAI gpt-image (Standard, kann Bilder auch nachbessern)
// und optional Infomaniak (Flux, Schweiz; nur kurze Prompts, kein Nachbessern).

export type ImageProvider = "openai" | "infomaniak";

export const IMAGE_PROVIDER_LABELS: Record<ImageProvider, string> = {
  openai: "OpenAI gpt-image",
  infomaniak: "Infomaniak / Flux (Schweiz)",
};

export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare";
export const INFOMANIAK_IMAGE_MODEL = process.env.INFOMANIAK_IMAGE_MODEL || "";

export function imageProviderReady(p: ImageProvider): boolean {
  if (p === "openai") return !!process.env.OPENAI_API_KEY;
  return !!process.env.INFOMANIAK_TOKEN && !!process.env.INFOMANIAK_PRODUCT_ID && !!INFOMANIAK_IMAGE_MODEL;
}

export function availableImageProviders(): ImageProvider[] {
  return (["openai", "infomaniak"] as ImageProvider[]).filter(imageProviderReady);
}

export type Quality = "medium" | "high";

export type ImageResult = {
  b64: string;
  mime: string;
  provider: ImageProvider;
  model: string;
  size: string;
  inputTokens: number;
  outputTokens: number;
};

/** Seitenverhältnis aus dem Generator → Pixelmass. gpt-image-2.x erlaubt freie Masse (Vielfache von 16). */
export function sizeFor(format: string, provider: ImageProvider): string {
  const key = format.split(" ")[0];
  if (provider === "openai" && /^gpt-image-2/.test(OPENAI_IMAGE_MODEL)) {
    return ({ "16:9": "1536x864", "4:3": "1408x1056", "1:1": "1024x1024", "3:4": "1056x1408" } as Record<string, string>)[key] ?? "1536x864";
  }
  if (provider === "openai") {
    return ({ "16:9": "1536x1024", "4:3": "1536x1024", "1:1": "1024x1024", "3:4": "1024x1536" } as Record<string, string>)[key] ?? "1536x1024";
  }
  return ({ "16:9": "1792x1024", "4:3": "1792x1024", "1:1": "1024x1024", "3:4": "1024x1792" } as Record<string, string>)[key] ?? "1792x1024";
}

async function openaiRequest(path: string, body: BodyInit, json: boolean, signal?: AbortSignal) {
  const res = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(json ? { "Content-Type": "application/json" } : {}) },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 400);
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* kein JSON */ }
    if (/safety|moderation|content policy/i.test(msg)) throw new Error("Der Bilddienst hat den Prompt abgelehnt (Inhaltsrichtlinie). Formuliere die Szene neutraler.");
    throw new Error(`OpenAI antwortet mit ${res.status}: ${msg}`);
  }
  const j = JSON.parse(text);
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI hat kein Bild geliefert.");
  return {
    b64: b64 as string,
    inputTokens: Number(j.usage?.input_tokens ?? 0),
    outputTokens: Number(j.usage?.output_tokens ?? 0),
    model: String(j.model ?? OPENAI_IMAGE_MODEL),
  };
}

export async function generateImage(a: { provider: ImageProvider; prompt: string; format: string; quality: Quality; signal?: AbortSignal }): Promise<ImageResult> {
  if (!imageProviderReady(a.provider)) throw new Error(`${IMAGE_PROVIDER_LABELS[a.provider]} ist nicht konfiguriert.`);
  const size = sizeFor(a.format, a.provider);
  if (a.provider === "openai") {
    const r = await openaiRequest("images/generations", JSON.stringify({
      model: OPENAI_IMAGE_MODEL, prompt: a.prompt, n: 1, size, quality: a.quality,
      output_format: "jpeg", output_compression: 85, moderation: "low",
    }), true, a.signal);
    return { ...r, mime: "image/jpeg", provider: "openai", size };
  }
  // Infomaniak: OpenAI-kompatibel, aber Prompt auf ~77 Tokens begrenzt → auf den ersten Absatz plus Ausschlüsse kürzen.
  const short = a.prompt.split("\n\n")[0].slice(0, 300);
  const res = await fetch(`https://api.infomaniak.com/1/ai/${process.env.INFOMANIAK_PRODUCT_ID}/openai/images/generations`, {
    method: "POST",
    signal: a.signal,
    headers: { Authorization: `Bearer ${process.env.INFOMANIAK_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: INFOMANIAK_IMAGE_MODEL, prompt: short, n: 1, size, response_format: "b64_json" }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Infomaniak antwortet mit ${res.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text);
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("Infomaniak hat kein Bild geliefert.");
  const mime = b64.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return { b64, mime, provider: "infomaniak", model: INFOMANIAK_IMAGE_MODEL, size, inputTokens: 0, outputTokens: 0 };
}

/** Nachbessern: bestehendes Bild plus Änderungsauftrag (nur OpenAI). */
export async function editImage(a: { b64: string; mime: string; instruction: string; context: string; size: string; quality: Quality; signal?: AbortSignal }): Promise<ImageResult> {
  if (!imageProviderReady("openai")) throw new Error("Nachbessern braucht OpenAI (OPENAI_API_KEY fehlt).");
  const fd = new FormData();
  fd.set("model", OPENAI_IMAGE_MODEL);
  fd.set("prompt", `${a.instruction}\n\nAlles Übrige bleibt wie im Ausgangsbild. Ursprüngliche Bildbeschreibung zur Orientierung:\n${a.context}`);
  fd.set("size", a.size);
  fd.set("quality", a.quality);
  fd.set("output_format", "jpeg");
  fd.set("output_compression", "85");
  const bytes = Buffer.from(a.b64, "base64");
  fd.set("image", new Blob([bytes], { type: a.mime }), a.mime === "image/png" ? "bild.png" : "bild.jpg");
  const r = await openaiRequest("images/edits", fd, false, a.signal);
  return { ...r, mime: "image/jpeg", provider: "openai", size: a.size };
}
