// Stripe-Anbindung für das Einzelpersonen-Abo – bewusst ohne SDK, nur die vier benötigten REST-Aufrufe.
import { createHmac, timingSafeEqual } from "node:crypto";

export type Plan = "month" | "year";

const PRICES: Record<Plan, string | undefined> = {
  month: process.env.STRIPE_PRICE_MONTH,
  year: process.env.STRIPE_PRICE_YEAR,
};

export function stripeReady() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && PRICES.month && PRICES.year);
}

async function call(method: "GET" | "POST", path: string, params?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe: ${data?.error?.message ?? res.status}`);
  return data;
}

/** Bezahlseite für ein Abo; gibt die Adresse zurück, auf die weitergeleitet wird. */
export async function createCheckout(a: { userId: number; email: string; plan: Plan; origin: string; customerId?: string | null }): Promise<string> {
  const p: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": PRICES[a.plan]!,
    "line_items[0][quantity]": "1",
    client_reference_id: String(a.userId),
    "subscription_data[metadata][user_id]": String(a.userId),
    success_url: `${a.origin}/zugang?status=danke`,
    cancel_url: `${a.origin}/zugang?status=abgebrochen`,
    locale: "de",
    allow_promotion_codes: "true",
  };
  // Schweizer MWST: in Stripe angelegter Steuersatz (inklusive), erscheint auf den Rechnungen
  if (process.env.STRIPE_TAX_RATE) p["subscription_data[default_tax_rates][0]"] = process.env.STRIPE_TAX_RATE;
  if (a.customerId) p.customer = a.customerId;
  else p.customer_email = a.email;
  return (await call("POST", "checkout/sessions", p)).url as string;
}

/** Ende der bezahlten Periode (Unix-Sekunden). Je nach API-Version am Abo oder an der Abo-Position. */
export async function subscriptionPeriodEnd(subscriptionId: string): Promise<number | null> {
  const sub = await call("GET", `subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (!["active", "trialing", "past_due"].includes(sub.status)) return null;
  return (sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null) as number | null;
}

/** Stripe-Kundenportal: Zahlungsmittel ändern, Rechnungen ansehen, kündigen. */
export async function createPortal(customerId: string, origin: string): Promise<string> {
  return (await call("POST", "billing_portal/sessions", { customer: customerId, return_url: `${origin}/app` })).url as string;
}

/** Prüft die Signatur eines Webhook-Aufrufs (Stripe-Signature: t=…,v1=…) und gibt das Ereignis zurück. */
export function verifyWebhook(payload: string, header: string | null): { type: string; data: { object: Record<string, unknown> } } | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = header.split(",").map((s) => s.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return null;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  const ok = sigs.some((s) => { const b = Buffer.from(s); return b.length === expected.length && timingSafeEqual(b, expected); });
  return ok ? JSON.parse(payload) : null;
}
