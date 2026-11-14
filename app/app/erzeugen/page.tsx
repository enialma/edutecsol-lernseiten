import { DEFAULT_MODELS, PROVIDER_LABELS, providersFor } from "@/lib/ai";
import { isSwissOnly } from "@/lib/users";
import { auth } from "@/auth";
import { PRESETS } from "@/lib/prompt";
import { quotaFor } from "@/lib/quota";
import { listImages } from "@/lib/images";
import AppShell from "../../AppShell";
import Form from "./Form";

export const dynamic = "force-dynamic";

export default async function ErzeugenPage({ searchParams }: { searchParams: Promise<{ bild?: string; typ?: string }> }) {
  const session = await auth();
  const { bild, typ } = await searchParams;
  const bilder = (await listImages(Number(session!.user.id), "mine")).map((b) => ({ id: b.id, title: b.title + (b.instruction ? " (Variante)" : "") }));
  const quota = await quotaFor(Number(session!.user.id), session!.user.role === "admin");
  const swissOnly = await isSwissOnly(Number(session!.user.id));
  const providers = providersFor(swissOnly).map((p) => ({
    id: p,
    label: PROVIDER_LABELS[p],
    model: DEFAULT_MODELS[p],
    used: quota[p].used,
    limit: quota[p].limit,
  }));
  const presets = Object.entries(PRESETS).map(([id, p]) => ({ id, ...p }));
  return (
    <>
      <AppShell active="neu">
          <header className="page-head tight">
            <div>
              <h1>Neue Seite erzeugen</h1>
              <p>Material geben, wählen, was entsteht, einstellen, erzeugen. Die fertige Seite liegt danach in deiner Sammlung.</p>
              {swissOnly && <p className="swiss-note">Deine Schule nutzt nur KI mit Standort Schweiz (Infomaniak).</p>}
            </div>
          </header>
          {providers.length === 0 ? (
            <div className="msg err">{swissOnly ? "Infomaniak ist gerade nicht eingerichtet. Bitte info@edutecsol.ch melden." : "Noch kein KI-Anbieter konfiguriert (ANTHROPIC_API_KEY, OPENAI_API_KEY oder INFOMANIAK_TOKEN fehlt)."}</div>
          ) : (
            <Form providers={providers} presets={presets} bilder={bilder} initialBild={bild ? Number(bild) : 0} initialTyp={typ} isAdmin={session!.user.role === "admin"} />
          )}
              </AppShell>
    </>
  );
}
