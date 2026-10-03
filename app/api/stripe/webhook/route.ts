// Stripe meldet Zahlungen hierher: erste Zahlung schaltet das Konto frei, jede weitere verlängert es.
import { activateSubscription, clearSubscription, userByCustomer } from "@/lib/billing";
import { subscriptionPeriodEnd, verifyWebhook } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = await req.text();
  const event = verifyWebhook(payload, req.headers.get("stripe-signature"));
  if (!event) return new Response("Ungültige Signatur.", { status: 400 });
  const o = event.data.object;

  try {
    if (event.type === "checkout.session.completed") {
      const userId = Number(o.client_reference_id);
      const customerId = String(o.customer ?? "");
      const subscriptionId = String(o.subscription ?? "");
      if (userId && customerId && subscriptionId) {
        const end = await subscriptionPeriodEnd(subscriptionId);
        if (end) await activateSubscription(userId, customerId, subscriptionId, end);
      }
    } else if (event.type === "invoice.paid") {
      const user = await userByCustomer(String(o.customer ?? ""));
      if (user?.subscriptionId) {
        const end = await subscriptionPeriodEnd(user.subscriptionId);
        if (end) await activateSubscription(user.id, String(o.customer), user.subscriptionId, end);
      }
    } else if (event.type === "customer.subscription.deleted") {
      await clearSubscription(String(o.id ?? ""));
    }
  } catch (e) {
    console.error("Stripe-Webhook fehlgeschlagen", event.type, e);
    return new Response("Fehler bei der Verarbeitung.", { status: 500 }); // Stripe versucht es erneut
  }
  return new Response("ok");
}
