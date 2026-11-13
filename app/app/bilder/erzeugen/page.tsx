import Link from "next/link";
import { auth } from "@/auth";
import { PRESETS } from "@/lib/bildprompt";
import { availableImageProviders, IMAGE_PROVIDER_LABELS, INFOMANIAK_IMAGE_MODEL, OPENAI_IMAGE_MODEL } from "@/lib/imagegen";
import { imageQuotaFor } from "@/lib/quota";
import AppShell from "../../../AppShell";
import Form from "./Form";

export const dynamic = "force-dynamic";

export default async function BildErzeugenPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const session = await auth();
  const { r } = await searchParams;
  const quota = await imageQuotaFor(Number(session!.user.id), session!.user.role === "admin");
  const providers = availableImageProviders().map((p) => ({
    id: p, label: IMAGE_PROVIDER_LABELS[p], model: p === "openai" ? OPENAI_IMAGE_MODEL : INFOMANIAK_IMAGE_MODEL,
  }));
  const presets = Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label }));
  return (
    <AppShell active="bilder">
      <nav className="crumb" aria-label="Brotkrumen"><Link href="/app/bilder">Bilder</Link> <span aria-hidden="true">/</span> Neues Bild</nav>
      <header className="page-head tight">
        <div>
          <h1>Bild direkt erzeugen</h1>
          <p>
            Dasselbe Rezept wie im Bildprompt-Generator: erst die Lernaufgabe, dann das Bild beschreiben. Das fertige
            Bild landet in deiner Sammlung, mit Arbeitsauftrag und Kennzeichnung, und lässt sich Schritt für Schritt nachbessern.
          </p>
        </div>
      </header>
      {providers.length === 0 ? (
        <div className="msg err">Noch kein Bilddienst konfiguriert (OPENAI_API_KEY fehlt).</div>
      ) : (
        <Form providers={providers} presets={presets} quota={quota} initial={r ?? null} />
      )}
    </AppShell>
  );
}
