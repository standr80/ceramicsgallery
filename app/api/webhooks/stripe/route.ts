import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const stripeSignature = (await headers()).get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSignature || !webhookSecret) {
      console.error("Stripe webhook: missing signature or secret");
      return NextResponse.json(
        { message: "Webhook configuration error" },
        { status: 500 }
      );
    }

    event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook verification failed:", msg);
    return NextResponse.json(
      { message: `Webhook Error: ${msg}` },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const potterId = session.metadata?.potter_id;
  const stripeAccountId = session.metadata?.stripe_account_id;

  if (!potterId || !stripeAccountId) {
    console.error("Webhook: missing potter_id or stripe_account_id in metadata");
    return NextResponse.json(
      { message: "Invalid metadata" },
      { status: 400 }
    );
  }

  const amountSubtotal = session.amount_subtotal; // net of tax, in pence
  if (amountSubtotal == null || amountSubtotal < 1) {
    console.error("Webhook: invalid amount_subtotal");
    return NextResponse.json(
      { message: "Invalid amount" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: defaultRow } = await admin
    .from("settings")
    .select("value")
    .eq("key", "default_commission_percent")
    .single();

  const { data: potter } = await admin
    .from("potters")
    .select("commission_override_percent")
    .eq("id", potterId)
    .single();

  const defaultCommission = defaultRow
    ? parseFloat(defaultRow.value)
    : 10;
  const commissionPercent =
    potter?.commission_override_percent != null
      ? Number(potter.commission_override_percent)
      : defaultCommission;

  const commissionAmount = Math.round(
    (amountSubtotal * commissionPercent) / 100
  );
  const transferAmount = amountSubtotal - commissionAmount;

  if (transferAmount < 1) {
    console.error("Webhook: transfer amount too small");
    return NextResponse.json(
      { message: "Transfer amount too small" },
      { status: 400 }
    );
  }

  try {
    await stripe.transfers.create({
      amount: transferAmount,
      currency: (session.currency ?? "gbp").toLowerCase(),
      destination: stripeAccountId,
      metadata: {
        potter_id: potterId,
        checkout_session_id: session.id,
        commission_percent: String(commissionPercent),
        commission_amount: String(commissionAmount),
      },
    });
  } catch (err) {
    console.error("Stripe transfer failed:", err);
    return NextResponse.json(
      { message: "Transfer failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
