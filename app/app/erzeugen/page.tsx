import { availableProviders, DEFAULT_MODELS, PROVIDER_LABELS } from "@/lib/ai";
import { auth } from "@/auth";
import { PRESETS } from "@/lib/prompt";
import { quotaFor } from "@/lib/quota";
import { listImages } from "@/lib/images";
import Topbar from "../../Topbar";
import Form from "./Form";

export const dynamic = "force-dynamic";

export default async function ErzeugenPage({ searchParams }: { searchParams: Promise<{ bild?: string }> }) {
  const session = await auth();
  const { bild } = await searchParams;
  const bilder = (await listImages(Number(session!.user.id), "mine")).map((b) => ({ id: b.id, title: b.title + (b.instruction ? " (Variante)" : "") }));
  const quota = await quotaFor(Number(session!.user.id), session!.user.role === "admin");
  const providers = availableProviders().map((p) => ({
    id: p,
    label: PROVIDER_LABELS[p],
    model: DEFAULT_MODELS[p],
    used: quota[p].used,
    limit: quota[p].limit,
  }));
  const presets = Object.entries(PRESETS).map(([id, p]) => ({ id, ...p }));
  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <p className="kicker">Mein Bereich</p>
          <h1>Lernseite direkt erzeugen</h1>
          <p className="lead">
            Material hochladen oder Thema beschreiben, didaktische Achsen wählen – die fertige interaktive Lernseite
            landet in deiner Sammlung. Ohne Umweg über einen Chat.
          </p>
          {providers.length === 0 ? (
            <div className="msg err">Noch kein KI-Anbieter konfiguriert (ANTHROPIC_API_KEY, OPENAI_API_KEY oder INFOMANIAK_TOKEN fehlt).</div>
          ) : (
            <Form providers={providers} presets={presets} bilder={bilder} initialBild={bild ? Number(bild) : 0} isAdmin={session!.user.role === "admin"} />
          )}
        </div>
      </main>
    </>
  );
}
