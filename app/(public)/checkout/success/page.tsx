import Link from "next/link";
import { getStripe, penceToDisplay } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeCheckout, formatAddress } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thank you | Ceramics Gallery", robots: { index: false } };

type PaidOrder = {
  id: string; status: string; fulfilment: string; total_pence: number; buyer_email: string | null;
  shipping_address: Record<string, string | null> | null;
  piece: { title: string }; potter: { slug: string; display_name: string; studio_name: string | null };
};

interface Props { searchParams: Promise<{ session_id?: string; a?: string }> }

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id, a } = await searchParams;
  let order = null as PaidOrder | null;

  if (session_id?.startsWith("cs_") && a?.startsWith("acct_")) {
    // Confirm with Stripe directly, so the order is recorded even before the webhook arrives.
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id, { stripeAccount: a });
      await completeCheckout(session);
    } catch (err) {
      console.error("[checkout/success] could not confirm session", err);
    }
    const { data } = await createAdminClient().from("orders")
      .select("id, status, fulfilment, total_pence, buyer_email, shipping_address, piece:pieces(title), potter:potters(slug, display_name, studio_name)")
      .eq("stripe_checkout_session", session_id).maybeSingle();
    order = data as PaidOrder | null;
  }

  const paid = order && order.status !== "pending" && order.status !== "cancelled";
  const studio = order ? order.potter.studio_name ?? order.potter.display_name : "";

  return (
    <div className="py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        {paid && order ? (
          <>
            <p className="kicker">Order {order.id.slice(0, 8).toUpperCase()}</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ink leading-none mt-3">Thank you.</h1>
            <p className="text-ink/70 text-lg mt-5">
              <strong className="text-ink">{order.piece.title}</strong> is yours. You paid {penceToDisplay(order.total_pence)}
              {order.buyer_email ? <>, and a receipt is on its way to {order.buyer_email}</> : null}.
            </p>
            <div className="mt-8 rounded-3xl bg-celadon-light/60 p-6 text-left text-ink/80">
              {order.fulfilment === "ship" ? (
                <>
                  <p className="kicker text-ink/65 mb-2">Posting to</p>
                  <p className="whitespace-pre-line">{formatAddress(order.shipping_address)}</p>
                  <p className="mt-4 text-sm">{studio} will pack it carefully and send it on. You can reply to your receipt email to reach them.</p>
                </>
              ) : (
                <p>{studio} will email you to arrange a time to collect. You can reply to your receipt email to reach them.</p>
              )}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`/${order.potter.slug}`} className="btn-secondary">More from {studio}</Link>
              <Link href="/shop" className="btn-primary">Back to the shop</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-5xl text-ink leading-none">Nearly there</h1>
            <p className="text-ink/70 text-lg mt-5">
              We&apos;re still waiting for the payment to be confirmed. If it went through, you&apos;ll get an email receipt shortly.
            </p>
            <Link href="/shop" className="btn-primary mt-8 inline-flex">Back to the shop</Link>
          </>
        )}
      </div>
    </div>
  );
}
