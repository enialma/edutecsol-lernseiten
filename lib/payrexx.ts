// Payrexx-Anbindung für das Einzelpersonen-Abo – bewusst ohne SDK, nur die drei benötigten REST-Aufrufe.
import { createHash, timingSafeEqual } from "node:crypto";

export type Plan = "month" | "year";

// Preise in Rappen, inklusive MWST
export const AMOUNT: Record<Plan, number> = { month: 800, year: 6000 };
const INTERVAL: Record<Plan, string> = { month: "P1M", year: "P1Y" };
const PURPOSE: Record<Plan, string> = { month: "EDUTECSOL Lernwege – Monatsabo", year: "EDUTECSOL Lernwege – Jahresabo" };

export function payrexxReady() {
  return !!(process.env.PAYREXX_INSTANCE && process.env.PAYREXX_API_KEY && process.env.PAYREXX_WEBHOOK_KEY);
}

async function call(method: "GET" | "POST" | "DELETE", path: string, params?: Record<string, string>) {
  const res = await fetch(`https://api.payrexx.com/v1.0/${path}/?instance=${encodeURIComponent(process.env.PAYREXX_INSTANCE ?? "")}`, {
    method,
    headers: { "X-API-KEY": process.env.PAYREXX_API_KEY ?? "", "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.status !== "success") throw new Error(`Payrexx: ${data?.message ?? res.status}`);
  return data;
}

/** Referenz auf der Zahlung: verbindet sie mit dem Konto und der gewählten Laufzeit. */
const reference = (userId: number, plan: Plan) => `lw-${userId}-${plan === "month" ? "m" : "y"}`;

export function parseReference(ref: unknown): { userId: number; plan: Plan } | null {
  const m = /^lw-(\d+)-([my])$/.exec(String(ref ?? ""));
  return m ? { userId: Number(m[1]), plan: m[2] === "m" ? "month" : "year" } : null;
}

/** Bezahlseite für ein Abo; gibt die Adresse zurück, auf die weitergeleitet wird. */
export async function createCheckout(a: { userId: number; email: string; plan: Plan; origin: string }): Promise<string> {
  const p: Record<string, string> = {
    amount: String(AMOUNT[a.plan]),
    currency: "CHF",
    // Schweizer MWST, im Betrag enthalten; erscheint auf dem Beleg
    vatRate: process.env.PAYREXX_VAT_RATE ?? "8.1",
    purpose: PURPOSE[a.plan],
    referenceId: reference(a.userId, a.plan),
    "fields[email][value]": a.email,
    language: "de",
    successRedirectUrl: `${a.origin}/zugang?status=danke`,
    failedRedirectUrl: `${a.origin}/zugang?status=abgebrochen`,
    cancelRedirectUrl: `${a.origin}/zugang?status=abgebrochen`,
    // Abo mit automatischer Verlängerung um die gewählte Laufzeit
    subscriptionState: "1",
    subscriptionInterval: INTERVAL[a.plan],
    subscriptionPeriod: INTERVAL[a.plan],
    subscriptionCancellationInterval: "P1D",
  };
  return (await call("POST", "Gateway", p)).data[0].link as string;
}

export type Transaction = { status: string; amount: number; referenceId: string | null; subscriptionId: string | null; validUntil: string | null };

/** Zahlung bei Payrexx nachschlagen – der Webhook-Inhalt selbst wird nicht als Beleg verwendet. */
export async function getTransaction(id: string): Promise<Transaction | null> {
  const t = (await call("GET", `Transaction/${encodeURIComponent(id)}`)).data?.[0];
  if (!t) return null;
  const s = t.subscription ?? null;
  return {
    status: String(t.status ?? ""),
    amount: Number(t.amount ?? 0),
    referenceId: t.referenceId ? String(t.referenceId) : null,
    subscriptionId: s?.id ? String(s.id) : null,
    validUntil: (s?.valid_until ?? s?.validUntil ?? null) as string | null,
  };
}

/**
 * Ende der bezahlten Periode (Unix-Sekunden): das «gültig bis» von Payrexx, wenn es in der Zukunft liegt,
 * sonst ab heute um die Laufzeit gerechnet.
 */
export function periodEnd(validUntil: string | null, plan: Plan): number {
  const given = validUntil ? Date.parse(validUntil) : NaN;
  if (given > Date.now()) return Math.floor(given / 1000);
  const d = new Date();
  if (plan === "month") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return Math.floor(d.getTime() / 1000);
}

/** Abo beenden: Es wird nicht mehr abgebucht, der bezahlte Zugang läuft aus. */
export async function cancelSubscription(subscriptionId: string) {
  await call("DELETE", `Subscription/${encodeURIComponent(subscriptionId)}`);
}

/** Payrexx signiert Webhooks nicht – der geheime Schlüssel steht deshalb in der Webhook-Adresse (?key=…). */
export function webhookKeyOk(key: string | null): boolean {
  const secret = process.env.PAYREXX_WEBHOOK_KEY;
  if (!secret || !key) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(key), h(secret));
}
