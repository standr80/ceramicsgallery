import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPotter } from "@/lib/get-potter";
import { createAdminClient } from "@/lib/supabase/admin";
import { penceToDisplay } from "@/lib/stripe";
import { formatAddress } from "@/lib/orders";
import { markCollected, markDispatched } from "@/app/actions/orders";

export const dynamic = "force-dynamic";

type Order = {
  id: string; status: string; fulfilment: "ship" | "collect"; item_pence: number; shipping_pence: number;
  total_pence: number; application_fee_pence: number; buyer_name: string | null; buyer_email: string | null;
  buyer_phone: string | null; shipping_address: Record<string, string | null> | null; tracking_ref: string | null;
  paid_at: string | null; piece: { title: string; slug: string } | null;
};

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }) : "";

export default async function OrdersPage() {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");
  const { data } = await createAdminClient().from("orders")
    .select("id, status, fulfilment, item_pence, shipping_pence, total_pence, application_fee_pence, buyer_name, buyer_email, buyer_phone, shipping_address, tracking_ref, paid_at, piece:pieces(title, slug)")
    .eq("potter_id", potter.id)
    .in("status", ["paid", "dispatched", "collected", "completed", "refunded"])
    .order("paid_at", { ascending: false });
  const orders = (data ?? []) as unknown as Order[];
  const todo = orders.filter((o) => o.status === "paid");
  const done = orders.filter((o) => o.status !== "paid");

  return (
    <div className="max-w-3xl flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-clay-900">Orders</h1>
        <p className="text-stone-600 mt-1">
          Pots bought online. Payments go straight to your Stripe account, less card fees and the {(potter.commission_bps / 100).toFixed(0)}% commission.
        </p>
      </div>

      {orders.length === 0 && (
        <div className="card p-8 text-center text-stone-600">
          No orders yet. To sell online, give your pots a price and postage, and connect Stripe on the{" "}
          <Link href="/dashboard/connect-stripe" className="underline">Payments</Link> tab.
        </div>
      )}

      {todo.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-clay-900">To send or hand over ({todo.length})</h2>
          {todo.map((o) => <OrderCard key={o.id} o={o} slug={potter.slug} />)}
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-clay-900">Done</h2>
          {done.map((o) => <OrderCard key={o.id} o={o} slug={potter.slug} />)}
        </section>
      )}
    </div>
  );
}

function OrderCard({ o, slug }: { o: Order; slug: string }) {
  const label: Record<string, string> = { paid: o.fulfilment === "ship" ? "To post" : "To collect", dispatched: "Posted", collected: "Collected", completed: "Completed", refunded: "Refunded" };
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-clay-900">
            {o.piece ? <Link href={`/${slug}/${o.piece.slug}`} className="hover:underline">{o.piece.title}</Link> : "Piece"}
          </p>
          <p className="text-sm text-stone-600">
            Order {o.id.slice(0, 8).toUpperCase()} · paid {fmtDate(o.paid_at)} · {penceToDisplay(o.total_pence)}
            {o.shipping_pence ? ` (incl. ${penceToDisplay(o.shipping_pence)} postage)` : ""}
          </p>
        </div>
        <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${o.status === "paid" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
          {label[o.status] ?? o.status}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-600 mb-1">{o.fulfilment === "ship" ? "Post to" : "Collecting"}</p>
          <p className="whitespace-pre-line text-stone-800">{[o.buyer_name, o.fulfilment === "ship" ? formatAddress(o.shipping_address) : ""].filter(Boolean).join("\n")}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-600 mb-1">Contact</p>
          {o.buyer_email && <p><a href={`mailto:${o.buyer_email}`} className="underline">{o.buyer_email}</a></p>}
          {o.buyer_phone && <p>{o.buyer_phone}</p>}
          {o.tracking_ref && <p className="mt-2">Tracking: {o.tracking_ref}</p>}
        </div>
      </div>

      {o.status === "paid" && o.fulfilment === "ship" && (
        <form action={markDispatched.bind(null, o.id)} className="flex flex-col sm:flex-row gap-2">
          <input name="tracking" placeholder="Tracking reference (optional)" className="input-field flex-1 py-2" />
          <button className="btn-primary whitespace-nowrap">Mark as posted</button>
        </form>
      )}
      {o.status === "paid" && o.fulfilment === "collect" && (
        <form action={markCollected.bind(null, o.id)}>
          <button className="btn-primary">Mark as collected</button>
        </form>
      )}
      {o.status === "paid" && o.fulfilment === "ship" && (
        <p className="text-xs text-stone-600 -mt-2">The buyer gets an email when you mark it posted.</p>
      )}
    </div>
  );
}
