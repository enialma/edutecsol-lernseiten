// Payrexx meldet Zahlungen hierher: erste Zahlung schaltet das Konto frei, jede weitere verlängert es.
import { activateSubscription, clearSubscription, userBySubscription } from "@/lib/billing";
import { AMOUNT, getTransaction, parseReference, periodEnd, webhookKeyOk } from "@/lib/payrexx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Hook = { transactionId: string; txSubscriptionId: string; subscriptionId: string; subscriptionStatus: string };

/** Payrexx schickt je nach Einstellung JSON oder Formulardaten (transaction[id]=…). */
async function read(req: Request): Promise<Hook> {
  const raw = await req.text();
  const str = (v: unknown) => (v == null ? "" : String(v));
  try {
    const j = JSON.parse(raw);
    return {
      transactionId: str(j?.transaction?.id),
      txSubscriptionId: str(j?.transaction?.subscription?.id),
      subscriptionId: str(j?.subscription?.id),
      subscriptionStatus: str(j?.subscription?.status),
    };
  } catch {
    const f = new URLSearchParams(raw);
    return {
      transactionId: str(f.get("transaction[id]")),
      txSubscriptionId: str(f.get("transaction[subscription][id]")),
      subscriptionId: str(f.get("subscription[id]")),
      subscriptionStatus: str(f.get("subscription[status]")),
    };
  }
}

export async function POST(req: Request) {
  if (!webhookKeyOk(new URL(req.url).searchParams.get("key"))) return new Response("Ungültiger Schlüssel.", { status: 401 });
  const hook = await read(req);

  try {
    if (hook.transactionId) {
      const tx = await getTransaction(hook.transactionId);
      const subscriptionId = tx?.subscriptionId ?? hook.txSubscriptionId;
      if (tx?.status === "confirmed" && subscriptionId) {
        // Erste Zahlung trägt unsere Referenz; Verlängerungen werden über die Abo-Nummer zugeordnet
        const ref = parseReference(tx.referenceId);
        const userId = ref?.userId ?? (await userBySubscription(subscriptionId))?.id;
        const plan = ref?.plan ?? (tx.amount >= AMOUNT.year ? "year" : "month");
        if (userId) await activateSubscription(userId, subscriptionId, periodEnd(tx.validUntil, plan));
      }
    } else if (hook.subscriptionId && ["cancelled", "failed"].includes(hook.subscriptionStatus)) {
      await clearSubscription(hook.subscriptionId);
    }
  } catch (e) {
    console.error("Payrexx-Webhook fehlgeschlagen", hook.transactionId || hook.subscriptionId, e);
    return new Response("Fehler bei der Verarbeitung.", { status: 500 }); // Payrexx versucht es erneut
  }
  return new Response("ok");
}
