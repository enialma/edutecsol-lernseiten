// Öffentliche Liste der Beispielbilder aus dem Mitgliederbereich (für public/bild-beispiele.html).
import { EINSATZ_LABELS, TASKS, encodeState, labelText, normalize, type Einsatz } from "@/lib/bildprompt";
import { listExampleImages } from "@/lib/images";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listExampleImages();
  const out = rows.map((r) => {
    const s = normalize(r.params);
    const e = (r.einsatz ?? s.e) as Einsatz;
    return {
      id: r.id,
      anchor: `m${r.id}`,
      title: r.title,
      einsatz: EINSATZ_LABELS[e] ?? e,
      thema: r.thema ?? s.thema,
      ziel: s.ziel,
      braucht: s.braucht,
      pruefe: s.pruefe,
      prompt: r.prompt,
      task: TASKS[e] ?? TASKS.beschreiben,
      url: `/b/${r.share_token}`,
      label: labelText(r.provider === "openai" ? "OpenAI gpt-image" : "Infomaniak Flux", new Date()).replace(/, \d{1,2}\.\d{1,2}\.\d{4};/, `, ${r.created_at};`),
      r: encodeState(s),
    };
  });
  return Response.json(out, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
}
