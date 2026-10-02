// KI-Anbieter: Claude (Anthropic SDK) und Infomaniak (OpenAI-kompatibel, Schweiz). Beide streamen Text.
import Anthropic from "@anthropic-ai/sdk";

export type Provider = "claude" | "infomaniak";

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
  infomaniak: "Infomaniak / Apertus (Schweiz)",
};

export function providerReady(p: Provider): boolean {
  if (p === "claude") return !!process.env.ANTHROPIC_API_KEY;
  return !!process.env.INFOMANIAK_TOKEN && !!process.env.INFOMANIAK_PRODUCT_ID;
}

export function availableProviders(): Provider[] {
  return (["claude", "infomaniak"] as Provider[]).filter(providerReady);
}

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";
export const INFOMANIAK_MODEL = process.env.INFOMANIAK_MODEL || "swiss-ai/Apertus-70B-Instruct-2509";

type Args = { system: string; user: string; onDelta: (chunk: string) => void; signal?: AbortSignal };

async function runClaude({ system, user, onDelta, signal }: Args): Promise<GenResult> {
  const client = new Anthropic();
  const stream = client.beta.messages.stream(
    {
      model: CLAUDE_MODEL,
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
    model: final.model ?? CLAUDE_MODEL,
    inputTokens: (final.usage.input_tokens ?? 0) + (final.usage.cache_read_input_tokens ?? 0) + (final.usage.cache_creation_input_tokens ?? 0),
    outputTokens: final.usage.output_tokens ?? 0,
    stopReason: final.stop_reason ?? null,
  };
}

async function runInfomaniak({ system, user, onDelta, signal }: Args): Promise<GenResult> {
  const url = `https://api.infomaniak.com/2/ai/${process.env.INFOMANIAK_PRODUCT_ID}/openai/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${process.env.INFOMANIAK_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: INFOMANIAK_MODEL,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: 16000,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Infomaniak antwortet mit ${res.status}: ${(await res.text()).slice(0, 300)}`);
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
        if (j.choices?.[0]?.finish_reason) stopReason = j.choices[0].finish_reason;
        if (j.usage) { inputTokens = j.usage.prompt_tokens ?? 0; outputTokens = j.usage.completion_tokens ?? 0; }
      } catch { /* unvollständige Zeile */ }
    }
  }
  return { text, provider: "infomaniak", model: INFOMANIAK_MODEL, inputTokens, outputTokens, stopReason };
}

export function generate(provider: Provider, args: Args): Promise<GenResult> {
  if (!providerReady(provider)) throw new Error(`${PROVIDER_LABELS[provider]} ist nicht konfiguriert.`);
  return provider === "claude" ? runClaude(args) : runInfomaniak(args);
}
