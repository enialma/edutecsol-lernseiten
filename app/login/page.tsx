import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import Topbar from "../Topbar";

const ERRORS: Record<string, string> = {
  NotAllowed: "Diese E-Mail-Adresse ist nicht freigeschaltet. Bitte bei EDUTECSOL melden.",
  CredentialsSignin: "E-Mail oder Passwort stimmt nicht.",
  Configuration: "Login ist noch nicht fertig konfiguriert.",
  AccessDenied: "Zugriff verweigert.",
  OAuthCallbackError: "Microsoft hat die Anmeldung abgelehnt. Meist stimmt das Client-Secret in der Konfiguration nicht.",
  OAuthSignin: "Die Weiterleitung zu Microsoft konnte nicht gestartet werden.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const { error, callbackUrl } = await searchParams;
  // callbackUrl kann relativ (/admin/...) oder absolut (https://lernwege.../admin/...) kommen – nur den Pfad übernehmen.
  let target = "/app";
  if (callbackUrl) {
    try {
      const u = new URL(callbackUrl, "http://x");
      if (u.pathname.startsWith("/") && !u.pathname.startsWith("/login")) target = u.pathname + u.search;
    } catch {}
  }
  if (session?.user) redirect(target);

  const msSignIn = async () => {
    "use server";
    await signIn("microsoft-entra-id", { redirectTo: target });
  };
  const pwSignIn = async (fd: FormData) => {
    "use server";
    try {
      await signIn("credentials", { email: fd.get("email"), password: fd.get("password"), redirectTo: target });
    } catch (e) {
      if (e instanceof AuthError) redirect(`/login?error=${e.type}&callbackUrl=${encodeURIComponent(target)}`);
      throw e;
    }
  };
  const msReady = !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID;

  return (
    <>
      <Topbar />
      <main>
        <div className="wrap">
          <div className="login card">
            <p className="kicker">Geschützter Bereich</p>
            <h1>Anmelden</h1>
            <p className="lead">Zugang für freigeschaltete Lehrpersonen und Schulen.</p>
            {error && (
              <div className="msg err">
                {ERRORS[error] ?? "Anmeldung fehlgeschlagen."}
                <div className="small-note" style={{ marginTop: ".3rem" }}>Fehlercode: {error}</div>
              </div>
            )}
            <form action={msSignIn}>
              <button className="btn ms block" disabled={!msReady} title={msReady ? "" : "Microsoft-Login noch nicht konfiguriert"}>
                <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Mit Microsoft 365 anmelden
              </button>
            </form>
            <div className="divider">oder mit Passwort</div>
            <form action={pwSignIn}>
              <label htmlFor="email">E-Mail</label>
              <input id="email" name="email" type="email" autoComplete="username" required />
              <label htmlFor="password">Passwort</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required />
              <div style={{ marginTop: "1.1rem" }}>
                <button className="btn block">Anmelden</button>
              </div>
            </form>
            <p className="small-note" style={{ marginTop: "1.4rem" }}>
              Noch keinen Zugang? <a href="mailto:info@edutecsol.ch">info@edutecsol.ch</a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
