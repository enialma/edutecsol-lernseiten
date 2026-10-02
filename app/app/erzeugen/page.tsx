import { availableProviders, CLAUDE_MODEL, INFOMANIAK_MODEL, PROVIDER_LABELS } from "@/lib/ai";
import { PRESETS } from "@/lib/prompt";
import Topbar from "../../Topbar";
import Form from "./Form";

export const dynamic = "force-dynamic";

export default function ErzeugenPage() {
  const providers = availableProviders().map((p) => ({
    id: p,
    label: PROVIDER_LABELS[p],
    model: p === "claude" ? CLAUDE_MODEL : INFOMANIAK_MODEL,
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
            <div className="msg err">Noch kein KI-Anbieter konfiguriert (ANTHROPIC_API_KEY oder INFOMANIAK_TOKEN fehlt).</div>
          ) : (
            <Form providers={providers} presets={presets} />
          )}
        </div>
      </main>
    </>
  );
}
