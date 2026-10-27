// KI-Anbieter: Claude (Anthropic SDK), ChatGPT (OpenAI) und Infomaniak (OpenAI-kompatibel, Schweiz). Alle streamen Text.
import Anthropic from "@anthropic-ai/sdk";

export type Provider = "claude" | "infomaniak" | "openai";

export type GenResult = {
  text: string;
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Claude (Anthropic)",
  infomaniak: "Infomaniak (Schweiz)",
  openai: "ChatGPT (OpenAI)",
};

export function providerReady(p: Provider): boolean {
  if (p === "claude") return !!process.env.ANTHROPIC_API_KEY;
  if (p === "openai") return !!process.env.OPENAI_API_KEY;
  return !!process.env.INFOMANIAK_TOKEN && !!process.env.INFOMANIAK_PRODUCT_ID;
}

export function availableProviders(): Provider[] {
  return (["claude", "openai", "infomaniak"] as Provider[]).filter(providerReady);
}

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";
// Leerzeichen und Anführungszeichen aus dem Env-Wert entfernen (häufige Fehler beim Eintragen im Dashboard)
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["'`]+|["'`]+$/g, "").trim();
export const INFOMANIAK_MODEL = clean(process.env.INFOMANIAK_MODEL) || "Qwen/Qwen3.5-397B-A17B-FP8";
export const OPENAI_MODEL = clean(process.env.OPENAI_MODEL) || "gpt-5";
export const DEFAULT_MODELS: Record<Provider, string> = { claude: CLAUDE_MODEL, infomaniak: INFOMANIAK_MODEL, openai: OPENAI_MODEL };

/** model: optionale Übersteuerung des Standardmodells (nur Admins, zum Testen). */
type Args = { system: string; user: string; onDelta: (chunk: string) => void; signal?: AbortSignal; model?: string };

async function runClaude({ system, user, onDelta, signal, model: override }: Args): Promise<GenResult> {
  const client = new Anthropic();
  const model = override || CLAUDE_MODEL;
  const stream = client.beta.messages.stream(
    {
      model,
      max_tokens: 64000,
      // Policy-Ablehnungen serverseitig auf ein Ersatzmodell umleiten
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    } as never,
    { signal }
  );
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") onDelta(event.delta.text);
  }
  const final = await stream.finalMessage();
  const text = final.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return {
    text,
    provider: "claude",
    model: final.model ?? model,
    inputTokens: (final.usage.input_tokens ?? 0) + (final.usage.cache_read_input_tokens ?? 0) + (final.usage.cache_creation_input_tokens ?? 0),
    outputTokens: final.usage.output_tokens ?? 0,
    stopReason: final.stop_reason ?? null,
  };
}

/** OpenAI-kompatibler Chat-Endpunkt: Infomaniak (Schweiz) oder OpenAI direkt. */
async function runCompat(provider: "infomaniak" | "openai", { system, user, onDelta, signal, model: override }: Args): Promise<GenResult> {
  const model = override || DEFAULT_MODELS[provider];
  const url = provider === "openai"
    ? "https://api.openai.com/v1/chat/completions"
    : `https://api.infomaniak.com/2/ai/${process.env.INFOMANIAK_PRODUCT_ID}/openai/v1/chat/completions`;
  const token = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.INFOMANIAK_TOKEN;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      stream_options: { include_usage: true },
      // Neuere OpenAI-Modelle akzeptieren nur max_completion_tokens und keine Temperatur
      ...(provider === "openai" ? { max_completion_tokens: 16000 } : { max_tokens: 16000, temperature: 0.4 }),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text();
    // Bei falschem Modellnamen liefert Infomaniak die gültigen Namen mit – vollständig anzeigen
    const plain = body.replace(/\\"/g, '"').replace(/\\\//g, "/");
    const values = plain.match(/"values":\s*(\[[^\]]*\])/)?.[1];
    let list: string[] | null = null;
    try { list = values ? (JSON.parse(values) as string[]) : null; } catch { list = null; }
    if (list) throw new Error(`${PROVIDER_LABELS[provider]} kennt das Modell «${model}» (${model.length} Zeichen) nicht. Gültige Modelle: ${list.join(", ")}`);
    throw new Error(`${PROVIDER_LABELS[provider]} antwortet mit ${res.status}: ${plain.slice(0, 1500)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let inputTokens = 0, outputTokens = 0;
  let stopReason: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const data = l.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        const delta = j.choices?.[0]?.delta?.content;
        if (delta) { text += delta; onDelta(delta); }
        if (j.choices?.[0]?.finish_reason) stopReason = j.choices[0].finish_reason === "length" ? "max_tokens" : j.choices[0].finish_reason;
        if (j.usage) { inputTokens = j.usage.prompt_tokens ?? 0; outputTokens = j.usage.completion_tokens ?? 0; }
      } catch { /* unvollständige Zeile */ }
    }
  }
  return { text, provider, model, inputTokens, outputTokens, stopReason };
}

export function generate(provider: Provider, args: Args): Promise<GenResult> {
  if (!providerReady(provider)) throw new Error(`${PROVIDER_LABELS[provider]} ist nicht konfiguriert.`);
  return provider === "claude" ? runClaude(args) : runCompat(provider, args);
}
