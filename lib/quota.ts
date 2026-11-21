// Monatskontingent pro Person und Protokoll aller KI-Erzeugungen (bleibt bestehen, auch wenn die Seite gelöscht wird).
import { db, ready } from "./db";
import type { Provider } from "./ai";

async function q(sql: string, params: unknown[] = []) {
  await ready();
  return db().query(sql, params as never[]);
}

const num = (v: string | undefined, fallback: number) => (v && /^\d+$/.test(v) ? Number(v) : fallback);

/** Inklusive Lernseiten pro Kalendermonat; über Umgebungsvariablen anpassbar. Admins haben kein Limit. */
export const LIMITS: Record<Provider, number> = {
  claude: num(process.env.QUOTA_CLAUDE, 10),
  infomaniak: num(process.env.QUOTA_INFOMANIAK, 30),
  openai: num(process.env.QUOTA_OPENAI, 10),
};
/** Inklusive Bilder pro Kalendermonat (Erzeugen und Nachbessern zählen je einmal). */
export const LIMIT_BILDER = num(process.env.QUOTA_BILDER, 20);

/** Bilder im laufenden Kalendermonat (provider 'bild' im Protokoll). */
export async function imageQuotaFor(userId: number, isAdmin: boolean): Promise<{ used: number; limit: number | null }> {
  const rows = await q(
    `SELECT COUNT(*)::int AS n FROM generations WHERE user_id = $1 AND ok AND provider = 'bild' AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  return { used: Number(rows[0]?.n ?? 0), limit: isAdmin ? null : LIMIT_BILDER };
}

/** nachbessern: Nachbesserung einer Lernseite; zählt 0.2 im Kontingent der KI (siehe lib/kontingent.ts). */
export async function logGeneration(g: { userId: number; provider: string; model?: string | null; inputTokens: number; outputTokens: number; ok: boolean; nachbessern?: boolean }) {
  await q(
    `INSERT INTO generations (user_id, provider, model, input_tokens, output_tokens, ok, nachbessern) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [g.userId, g.provider, g.model ?? null, g.inputTokens, g.outputTokens, g.ok, g.nachbessern ?? false]
  );
}

export type Quota = Record<Provider, { used: number; limit: number | null }>;

// Verbrauch in Fünfteln gezählt (Lernseite 5, Nachbesserung 1), damit keine Rundungsfehler entstehen
const FUENFTEL = `CASE WHEN g.nachbessern THEN 1 ELSE 5 END`;

/** Verbrauch im laufenden Kalendermonat – nur gelungene Erzeugungen zählen, Nachbesserungen je 0.2. */
export async function quotaFor(userId: number, isAdmin: boolean): Promise<Quota> {
  const rows = await q(
    `SELECT g.provider, SUM(${FUENFTEL})::int AS f FROM generations g
     WHERE g.user_id = $1 AND g.ok AND g.created_at >= date_trunc('month', NOW()) GROUP BY g.provider`,
    [userId]
  );
  const used = (p: Provider) => Number(rows.find((r) => r.provider === p)?.f ?? 0) / 5;
  return {
    claude: { used: used("claude"), limit: isAdmin ? null : LIMITS.claude },
    infomaniak: { used: used("infomaniak"), limit: isAdmin ? null : LIMITS.infomaniak },
    openai: { used: used("openai"), limit: isAdmin ? null : LIMITS.openai },
  };
}

export type Usage = {
  email: string; name: string | null; institution: string | null; pages: number; claude_month: number; infomaniak_month: number; openai_month: number;
  claude: number; infomaniak: number; openai: number; bilder: number; bilder_month: number; input_tokens: number; output_tokens: number; last_page: string | null;
};

/** Erzeugungen und Tokens pro Person. Seiten = gelungene Erzeugungen; *_month = Kontingent (Nachbesserungen je 0.2); Tokens auch misslungene Versuche. */
export async function usageByUser(): Promise<Usage[]> {
  return (await q(
    `SELECT u.email, u.name, i.name AS institution,
       COUNT(g.id) FILTER (WHERE g.ok AND NOT g.nachbessern AND g.provider <> 'bild')::int AS pages,
       COUNT(g.id) FILTER (WHERE g.ok AND NOT g.nachbessern AND g.provider = 'bild')::int AS bilder,
       COUNT(g.id) FILTER (WHERE g.ok AND NOT g.nachbessern AND g.provider = 'bild' AND g.created_at >= date_trunc('month', NOW()))::int AS bilder_month,
       (COALESCE(SUM(${FUENFTEL}) FILTER (WHERE g.ok AND g.provider = 'claude' AND g.created_at >= date_trunc('month', NOW())), 0) / 5.0)::float8 AS claude_month,
       (COALESCE(SUM(${FUENFTEL}) FILTER (WHERE g.ok AND g.provider = 'infomaniak' AND g.created_at >= date_trunc('month', NOW())), 0) / 5.0)::float8 AS infomaniak_month,
       COUNT(g.id) FILTER (WHERE g.ok AND NOT g.nachbessern AND g.provider = 'claude')::int AS claude,
       COUNT(g.id) FILTER (WHERE g.ok AND NOT g.nachbessern AND g.provider = 'infomaniak')::int AS infomaniak,
       (COALESCE(SUM(${FUENFTEL}) FILTER (WHERE g.ok AND g.provider = 'openai' AND g.created_at >= date_trunc('month', NOW())), 0) / 5.0)::float8 AS openai_month,
       COUNT(g.id) FILTER (WHERE g.ok AND NOT g.nachbessern AND g.provider = 'openai')::int AS openai,
       COALESCE(SUM(g.input_tokens),0)::int AS input_tokens, COALESCE(SUM(g.output_tokens),0)::int AS output_tokens,
       to_char(MAX(g.created_at), 'DD.MM.YYYY') AS last_page
     FROM users u LEFT JOIN generations g ON g.user_id = u.id LEFT JOIN institutions i ON i.id = u.institution_id
     GROUP BY u.email, u.name, i.name ORDER BY pages DESC, u.email`
  )) as never;
}
