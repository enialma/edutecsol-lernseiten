// KI-Lerncoach: eine Antwort auf die bisherige Unterhaltung. Ohne Login (Freigabelink der Seite), nichts wird gespeichert
// ausser Zählern (Seite, Tag, Nachrichten, Tokens). Regeln liegen im System-Prompt (lib/coach.ts).
import { chat, providerReady, type ChatMsg } from "@/lib/ai";
import { getPageByToken } from "@/lib/pages";
import {
  cleanReply, coachAllowedFor, coachSystemPrompt, coachUsage, logCoachTopic, logCoachUsage, rateLimited,
  COACH_LIMIT_MONTH, COACH_LIMIT_PAGE_DAY, COACH_MAX_INPUT, COACH_MAX_TURNS, COACH_NAME, type CoachStil, type Kontext,
} from "@/lib/coach";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  let body: { token?: string; messages?: ChatMsg[]; kontext?: Kontext };
  try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage." }, 400); }
  const token = String(body.token ?? "");
  const page = await getPageByToken(token);
  if (!page) return json({ error: "Diese Lernseite ist nicht mehr freigegeben." }, 404);
  if (!page.coach || !page.owner_coach || !coachAllowedFor(page)) return json({ error: `${COACH_NAME} ist auf dieser Seite nicht eingeschaltet.` }, 403);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unbekannt";
  if (rateLimited(`${ip}:${page.id}`)) return json({ error: "Kurze Pause: Du hast in der letzten Stunde sehr viele Fragen gestellt. Versuch es später nochmals." }, 429);
  const usage = await coachUsage(page.id, page.user_id);
  if (usage.today >= COACH_LIMIT_PAGE_DAY) return json({ error: `${COACH_NAME} hat für heute auf dieser Seite genug geholfen. Morgen geht es weiter.` }, 429);
  if (usage.month >= COACH_LIMIT_MONTH) return json({ error: `Das Monatskontingent des Coachs ist aufgebraucht. Bitte der Lehrperson melden.` }, 429);

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMsg[] = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === "user" ? COACH_MAX_INPUT : 1200) }))
    .filter((m) => m.content)
    .slice(-COACH_MAX_TURNS * 2);
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Keine Frage erhalten." }, 400);

  const stil = (["streng", "gestuft", "erklaer"].includes(page.coach_stil) ? page.coach_stil : "gestuft") as CoachStil;
  const provider = page.coach_provider === "claude" && providerReady("claude") ? "claude" : providerReady("infomaniak") ? "infomaniak" : providerReady("claude") ? "claude" : null;
  if (!provider) return json({ error: "Kein KI-Anbieter konfiguriert." }, 503);

  try {
    const r = await chat(provider, { system: coachSystemPrompt(page, stil, body.kontext ?? {}), messages, maxTokens: 300, signal: req.signal });
    await logCoachUsage(page.id, r.inputTokens, r.outputTokens).catch(() => {});
    await logCoachTopic(page.id, body.kontext?.reiter).catch(() => {});
    const text = cleanReply(r.text) || "Erzähl mir, was du bis jetzt gemacht hast. Wo genau hängst du?";
    return json({ reply: text });
  } catch (e) {
    console.error("coach fehlgeschlagen", e);
    return json({ error: `${COACH_NAME} ist gerade nicht erreichbar. Versuch es in einer Minute nochmals.` }, 502);
  }
}
