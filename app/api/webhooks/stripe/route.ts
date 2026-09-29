import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return Response.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  const stripe = getStripe();
  let event: ReturnType<typeof stripe.webhooks.constructEvent> extends Promise<infer T> ? T : ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip events we've already processed
  const { data: existing } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) return Response.json({ received: true });

  await admin.from("stripe_events").insert({ id: event.id, type: event.type });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string; metadata?: Record<string, string> };
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await admin.rpc("mark_order_paid", { p_order_id: orderId });
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as {
      id: string;
      charges_enabled: boolean;
      payouts_enabled: boolean;
    };
    await admin
      .from("potters")
      .update({
        stripe_charges_ok: account.charges_enabled,
        stripe_payouts_ok: account.payouts_enabled,
      })
      .eq("stripe_account_id", account.id);
  }

  await admin
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", event.id);

  return Response.json({ received: true });
}
