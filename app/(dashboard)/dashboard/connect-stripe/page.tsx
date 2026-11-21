import { getCurrentPotter } from "@/lib/get-potter";
import { startStripeConnect } from "@/app/actions/stripe";
import { redirect } from "next/navigation";
import { syncStripeStatus } from "@/lib/stripe-sync";

export const dynamic = "force-dynamic";

export default async function ConnectStripePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const current = await getCurrentPotter();
  if (!current) redirect("/login");
  // Ask Stripe directly while the account isn't fully set up, so the status is right
  // straight after onboarding even if the webhook hasn't arrived.
  const potter = current.stripe_account_id && !(current.stripe_charges_ok && current.stripe_payouts_ok)
    ? await syncStripeStatus(current)
    : current;
  const { connected } = await searchParams;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-clay-900 mb-2">Payments</h1>
      <p className="text-stone-500 mb-8">
        Connect a Stripe account to take card payments. Money goes straight to your bank — Ceramics Gallery takes a small commission per sale.
      </p>

      {connected && potter.stripe_charges_ok && (
        <div className="card p-4 mb-6 bg-green-50 border-green-200">
          <p className="text-green-800 font-medium">Stripe connected successfully.</p>
        </div>
      )}
      {connected && !potter.stripe_charges_ok && (
        <div className="card p-4 mb-6 bg-amber-50 border-amber-200">
          <p className="text-amber-900 font-medium">Stripe still needs a few details before you can take payments.</p>
          <p className="text-amber-900 text-sm mt-1">Press &ldquo;Connect with Stripe&rdquo; below to finish where you left off.</p>
        </div>
      )}

      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${potter.stripe_charges_ok ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600"}`}>
            {potter.stripe_charges_ok ? "✓" : "1"}
          </div>
          <div>
            <p className="font-medium">Connect Stripe</p>
            <p className="text-sm text-stone-500">{potter.stripe_charges_ok ? "Connected" : "Not yet connected"}</p>
          </div>
        </div>

        {!potter.stripe_charges_ok && (
          <form action={startStripeConnect}>
            <button className="btn-primary w-full">Connect with Stripe →</button>
          </form>
        )}

        {potter.stripe_charges_ok && !potter.stripe_payouts_ok && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
            Your account is connected but payouts aren't enabled yet. Check your Stripe dashboard to complete verification.
          </p>
        )}
      </div>
    </div>
  );
}
