import { getCurrentPotter } from "@/lib/get-potter";
import { createConnectAccountLink } from "@/app/actions/stripe";
import { ConnectStripeForm } from "./ConnectStripeForm";

export default async function ConnectStripePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const potter = await getCurrentPotter();
  if (!potter) return null;

  const params = await searchParams;
  const justConnected = params.success === "1";

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-4">
        Payment setup
      </h2>
      <p className="text-stone-600 mb-6 max-w-xl">
        Connect your Stripe account to receive payouts when your pottery sells.
        You&apos;ll be redirected to Stripe to complete a short onboarding process.
      </p>
      {justConnected && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Your Stripe account has been connected. You&apos;re all set to receive
          payments.
        </div>
      )}
      <ConnectStripeForm
        hasStripeAccount={!!potter.stripe_account_id}
        connectAction={createConnectAccountLink}
      />
    </div>
  );
}
