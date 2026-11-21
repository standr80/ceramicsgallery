import type Stripe from "stripe";
import { getStripe, penceToDisplay } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_BCC, emailLayout, escapeHtml, potterEmail, sendEmail, siteUrl } from "@/lib/email";
import { getPublicImageUrl } from "@/lib/utils/images";

/** How long a buyer has to pay before the piece is released (Stripe's minimum is 30 minutes). */
const HOLD_MINUTES = 30;

export type Fulfilment = "ship" | "collect";

type BuyablePiece = {
  id: string; slug: string; title: string; status: string; price_pence: number | null;
  collection_available: boolean; shipping_band_id: number | null;
  potter: {
    id: string; slug: string; display_name: string; studio_name: string | null;
    stripe_account_id: string | null; stripe_charges_ok: boolean; commission_bps: number;
    is_demo: boolean; is_published: boolean; studio_address: string | null;
  };
  band: { code: string; label: string; default_price_pence: number } | null;
};

/** Loads a piece with everything checkout needs. Uses the service role: callers are server-only. */
export async function getBuyablePiece(pieceId: string): Promise<BuyablePiece | null> {
  const { data } = await createAdminClient()
    .from("pieces")
    .select(`id, slug, title, status, price_pence, collection_available, shipping_band_id,
      potter:potters!inner(id, slug, display_name, studio_name, stripe_account_id, stripe_charges_ok, commission_bps, is_demo, is_published, studio_address),
      band:shipping_bands(code, label, default_price_pence)`)
    .eq("id", pieceId)
    .maybeSingle();
  return (data as unknown as BuyablePiece) ?? null;
}

/** Postage options a buyer can choose for this piece. Empty means it can't be bought online. */
export function deliveryOptions(piece: Pick<BuyablePiece, "collection_available" | "band">) {
  const options: { value: Fulfilment; label: string; pence: number }[] = [];
  if (piece.band && piece.band.code !== "collect") {
    options.push({ value: "ship", label: `UK delivery (${piece.band.label.toLowerCase()})`, pence: piece.band.default_price_pence });
  }
  if (piece.collection_available) options.push({ value: "collect", label: "Collect from the studio", pence: 0 });
  return options;
}

/** Whether the piece page should offer "Buy now". */
export function canBuyOnline(piece: BuyablePiece) {
  return piece.status === "live" && piece.price_pence != null && piece.price_pence > 0
    && piece.potter.stripe_charges_ok && !!piece.potter.stripe_account_id
    && !piece.potter.is_demo && piece.potter.is_published
    && deliveryOptions(piece).length > 0;
}

/**
 * Holds the piece, records a pending order and opens a Stripe Checkout session on the
 * potter's own Stripe account (a direct charge: card fees are theirs, our commission
 * is the application fee). Returns the Checkout URL, or an error to show the buyer.
 */
export async function startPieceCheckout(pieceId: string, fulfilment: Fulfilment): Promise<{ url?: string; error?: string }> {
  const piece = await getBuyablePiece(pieceId);
  if (!piece || !canBuyOnline(piece)) return { error: "This piece can't be bought online right now." };
  const option = deliveryOptions(piece).find((o) => o.value === fulfilment);
  if (!option) return { error: "Please choose delivery or collection." };

  const admin = createAdminClient();
  const { data: reserved } = await admin.rpc("reserve_piece", { p_piece_id: piece.id });
  if (!reserved) return { error: "Sorry, someone else is buying this piece at the moment. Try again in half an hour." };

  const item = piece.price_pence!;
  const fee = Math.round((item * piece.potter.commission_bps) / 10_000);
  const total = item + option.pence;
  const expiresAt = Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60 + 60;
  const studio = piece.potter.studio_name ?? piece.potter.display_name;
  const pieceUrl = `${siteUrl()}/${piece.potter.slug}/${piece.slug}`;

  const { data: order, error } = await admin.from("orders").insert({
    potter_id: piece.potter.id,
    piece_id: piece.id,
    fulfilment,
    item_pence: item,
    shipping_pence: option.pence,
    total_pence: total,
    application_fee_pence: fee,
    expires_at: new Date(expiresAt * 1000).toISOString(),
  }).select("id").single();
  if (error || !order) {
    await admin.from("pieces").update({ status: "live" }).eq("id", piece.id).eq("status", "reserved");
    return { error: "Something went wrong. Please try again." };
  }

  const { data: cover } = await admin.from("piece_images").select("processed_path, original_path")
    .eq("piece_id", piece.id).order("position").limit(1).maybeSingle();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      currency: "gbp",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: item,
            product_data: {
              name: piece.title,
              description: `Handmade by ${studio}`,
              images: cover ? [getPublicImageUrl(cover.processed_path ?? cover.original_path)] : undefined,
            },
          },
        },
        ...(option.pence > 0 ? [{
          quantity: 1,
          price_data: { currency: "gbp", unit_amount: option.pence, product_data: { name: option.label } },
        }] : []),
      ],
      shipping_address_collection: fulfilment === "ship" ? { allowed_countries: ["GB"] } : undefined,
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        application_fee_amount: fee,
        description: `${piece.title} (Ceramics Gallery)`,
        metadata: { order_id: order.id, piece_id: piece.id },
      },
      metadata: { order_id: order.id, piece_id: piece.id },
      expires_at: expiresAt,
      success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}&a=${piece.potter.stripe_account_id}`,
      cancel_url: `${pieceUrl}?checkout=cancelled&order=${order.id}`,
    }, { stripeAccount: piece.potter.stripe_account_id! });

    await admin.from("orders").update({ stripe_checkout_session: session.id }).eq("id", order.id);
    return { url: session.url! };
  } catch (err) {
    console.error("[checkout] session create failed", err);
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    await admin.from("pieces").update({ status: "live" }).eq("id", piece.id).eq("status", "reserved");
    return { error: "We couldn't start the payment. Please try again, or message the potter." };
  }
}

/**
 * Marks an order paid once Stripe confirms payment, stores the buyer's details and sends
 * the emails. Safe to call more than once (the webhook and the thank-you page both call it).
 */
export async function completeCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return null;
  const admin = createAdminClient();
  const { data: before } = await admin.from("orders").select("id, status").eq("stripe_checkout_session", session.id).maybeSingle();
  if (!before) return null;

  const details = session.customer_details;
  const shipping = session.collected_information?.shipping_details ?? null;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  if (before.status === "pending") {
    await admin.from("orders").update({
      buyer_email: details?.email ?? null,
      buyer_name: shipping?.name ?? details?.name ?? null,
      buyer_phone: details?.phone ?? null,
      shipping_address: shipping?.address ?? null,
    }).eq("id", before.id);
    await admin.rpc("mark_order_paid", { p_checkout_session_id: session.id, p_payment_intent_id: paymentIntent });
    await sendOrderEmails(before.id);
  }
  return before.id;
}

/** Buyer came back from Stripe without paying: close their session and release the piece now. */
export async function cancelCheckout(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return;
  const admin = createAdminClient();
  const { data: o } = await admin.from("orders")
    .select("status, stripe_checkout_session, potter:potters(stripe_account_id)")
    .eq("id", orderId).maybeSingle();
  const potter = o?.potter as unknown as { stripe_account_id: string | null } | null;
  if (!o || o.status !== "pending" || !o.stripe_checkout_session || !potter?.stripe_account_id) return;
  try {
    // Expire first so the abandoned session can't still be paid after the piece is released.
    await getStripe().checkout.sessions.expire(o.stripe_checkout_session, {}, { stripeAccount: potter.stripe_account_id });
  } catch {
    // Already expired or completed. Fall through: release_order only acts on pending orders.
  }
  const session = await getStripe().checkout.sessions.retrieve(o.stripe_checkout_session, { stripeAccount: potter.stripe_account_id }).catch(() => null);
  if (session?.payment_status === "paid") { await completeCheckout(session); return; }
  await expireCheckout(o.stripe_checkout_session);
}

/** Releases the piece when a checkout expires unpaid. */
export async function expireCheckout(sessionId: string) {
  await createAdminClient().rpc("release_order", { p_checkout_session_id: sessionId });
}

export function formatAddress(a: Record<string, string | null> | null) {
  if (!a) return "";
  return [a.line1, a.line2, a.city, a.state, a.postal_code].filter(Boolean).join("\n");
}

async function sendOrderEmails(orderId: string) {
  const admin = createAdminClient();
  const { data: o } = await admin.from("orders")
    .select("*, piece:pieces(title, slug), potter:potters(id, slug, display_name, studio_name, studio_address)")
    .eq("id", orderId).single();
  if (!o) return;
  const studio = o.potter.studio_name ?? o.potter.display_name;
  const ref = o.id.slice(0, 8).toUpperCase();
  const address = escapeHtml(formatAddress(o.shipping_address)).replace(/\n/g, "<br>");
  const lines = `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;width:100%">
    <tr><td style="padding:4px 0">${escapeHtml(o.piece.title)}</td><td style="text-align:right">${penceToDisplay(o.item_pence)}</td></tr>
    ${o.shipping_pence ? `<tr><td style="padding:4px 0">Postage</td><td style="text-align:right">${penceToDisplay(o.shipping_pence)}</td></tr>` : ""}
    <tr><td style="padding:8px 0;border-top:1px solid #e5d2c0"><strong>Total paid</strong></td><td style="text-align:right;border-top:1px solid #e5d2c0"><strong>${penceToDisplay(o.total_pence)}</strong></td></tr>
  </table>`;
  const to = await potterEmail(o.potter.id);

  if (o.buyer_email) {
    await sendEmail({
      to: o.buyer_email,
      replyTo: to ?? undefined,
      subject: `Your order from ${studio}: ${o.piece.title}`,
      html: emailLayout(`
<p>Thank you${o.buyer_name ? `, ${escapeHtml(o.buyer_name.split(" ")[0])}` : ""}. Your payment went through and <strong>${escapeHtml(o.piece.title)}</strong> is yours.</p>
${lines}
<p>${o.fulfilment === "ship"
  ? `${escapeHtml(studio)} will pack it carefully and post it to:<br>${address}`
  : `${escapeHtml(studio)} will be in touch to arrange collection${o.potter.studio_address ? ` from:<br>${escapeHtml(o.potter.studio_address).replace(/\n/g, "<br>")}` : "."}`}</p>
<p>Questions? Just reply to this email and it will go straight to ${escapeHtml(studio)}.</p>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#948875">Order ${ref}</p>`),
    });
  }

  if (to) {
    await sendEmail({
      to,
      bcc: ADMIN_BCC,
      replyTo: o.buyer_email ?? undefined,
      subject: `Sold: ${o.piece.title}`,
      html: emailLayout(`
<p>Good news: <strong>${escapeHtml(o.piece.title)}</strong> has sold on Ceramics Gallery.</p>
${lines}
<p><strong>${o.fulfilment === "ship" ? "Please post it to" : "The buyer will collect it"}:</strong><br>
${escapeHtml(o.buyer_name ?? "")}${o.fulfilment === "ship" ? `<br>${address}` : ""}<br>
${escapeHtml(o.buyer_email ?? "")}${o.buyer_phone ? `<br>${escapeHtml(o.buyer_phone)}` : ""}</p>
<p>The payment is in your Stripe account, less card fees and the ${(o.application_fee_pence / o.item_pence * 100).toFixed(0)}% Ceramics Gallery commission (${penceToDisplay(o.application_fee_pence)}).</p>
<p><a href="${siteUrl()}/dashboard/orders" style="display:inline-block;background:#221b17;color:#f5efe6;padding:10px 18px;border-radius:10px;text-decoration:none;font-family:Arial,sans-serif">${o.fulfilment === "ship" ? "Mark as posted" : "View the order"}</a></p>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#948875">Order ${ref}. Reply to this email to contact the buyer.</p>`),
    });
  }
}
