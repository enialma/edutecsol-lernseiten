import Link from "next/link";
import { auth, signOut } from "@/auth";
import { availableProviders, PROVIDER_LABELS } from "@/lib/ai";
import { billingOf } from "@/lib/billing";
import { IS_PREVIEW_DB } from "@/lib/db";
import { imageQuotaFor, quotaFor } from "@/lib/quota";

// Rahmen des geschützten Bereichs: Seitenleiste in Navy (Navigation, Kontingent, Konto) und Arbeitsfläche.
// Auf schmalen Bildschirmen rutscht die Seitenleiste nach oben (siehe .shell in globals.css).

export type ShellKey = "start" | "neu" | "sammlung" | "klassen" | "bilder" | "benutzer";

const ICONS: Record<ShellKey, React.ReactNode> = {
  start: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  neu: <path d="M12 5v14M5 12h14" />,
  sammlung: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  klassen: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  bilder: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /></>,
  benutzer: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function Icon({ k }: { k: ShellKey }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[k]}
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function QuotaRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="q">
      <div className="q-line"><span>{label}</span><span>{limit === null ? used : `${used} / ${limit}`}</span></div>
      {limit !== null && <div className="q-bar" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>}
    </div>
  );
}

export default async function AppShell({ active, children }: { active?: ShellKey; children: React.ReactNode }) {
  const session = await auth();
  const u = session!.user;
  const userId = Number(u.id);
  const isAdmin = u.role === "admin";
  const [quota, bilder, billing] = await Promise.all([quotaFor(userId, isAdmin), imageQuotaFor(userId, isAdmin), billingOf(userId)]);
  const providers = availableProviders();
  const name = u.name || u.email || "";
  const monat = new Date().toLocaleDateString("de-CH", { month: "long", timeZone: "Europe/Zurich" });
  const konto = billing.subscriptionId ? "Abo aktiv" : billing.validUntil ? `Zugang bis ${billing.validUntil}` : isAdmin ? "Admin" : "";

  const nav: { k: ShellKey; href: string; label: string }[] = [
    { k: "start", href: "/app", label: "Übersicht" },
    { k: "neu", href: "/app/erzeugen", label: "Neue Seite" },
    { k: "sammlung", href: "/app/seiten", label: "Sammlung" },
    { k: "klassen", href: "/app/gruppen", label: "Klassen und Gruppen" },
    { k: "bilder", href: "/app/bilder", label: "Bilder" },
    ...(isAdmin ? [{ k: "benutzer" as const, href: "/admin/benutzer", label: "Benutzer" }] : []),
  ];

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          <Link href="/app" className="name">Lernwege</Link>
          <span className="by">von EDUTECSOL</span>
          {IS_PREVIEW_DB && <span className="side-test">Testplattform</span>}
        </div>

        <nav className="side-nav" aria-label="Hauptnavigation">
          {nav.map((n) => (
            <Link key={n.k} href={n.href} className={active === n.k ? "on" : undefined} aria-current={active === n.k ? "page" : undefined}>
              <Icon k={n.k} />{n.label}
            </Link>
          ))}
        </nav>

        <section className="side-quota" aria-label="Kontingent">
          <div className="side-label">Kontingent {monat}</div>
          {providers.map((p) => <QuotaRow key={p} label={PROVIDER_LABELS[p]} used={quota[p].used} limit={quota[p].limit} />)}
          <QuotaRow label="Bilder" used={bilder.used} limit={bilder.limit} />
          <div className="side-note">{isAdmin ? "Als Admin ohne Limit, gezählt wird trotzdem." : "Genutzt in diesem Monat. Am Monatsersten beginnt es neu."}</div>
        </section>

        <div className="side-user">
          <span className="avatar" aria-hidden="true">{initials(name)}</span>
          <span className="who"><span>{name}</span>{konto && <small>{konto}</small>}</span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="side-out">Abmelden</button>
          </form>
        </div>

        <div className="side-foot">
          <Link href="/">Startseite</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/agb">AGB</Link>
        </div>
      </aside>

      <main className="work">
        <div className="work-in">{children}</div>
      </main>
    </div>
  );
}
