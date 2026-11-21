import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reads a potter's Connect account straight from Stripe and saves its status.
 * The account.updated webhook does the same job, but this doesn't depend on the
 * webhook being configured or delivered, so the Payments page is always right.
 */
export async function syncStripeStatus(potter: {
  id: string;
  stripe_account_id: string | null;
  stripe_charges_ok: boolean;
  stripe_payouts_ok: boolean;
}) {
  if (!potter.stripe_account_id) return potter;
  try {
    const account = await getStripe().accounts.retrieve(potter.stripe_account_id);
    const charges = !!account.charges_enabled;
    const payouts = !!account.payouts_enabled;
    if (charges !== potter.stripe_charges_ok || payouts !== potter.stripe_payouts_ok) {
      await createAdminClient()
        .from("potters")
        .update({ stripe_charges_ok: charges, stripe_payouts_ok: payouts })
        .eq("id", potter.id);
    }
    return { ...potter, stripe_charges_ok: charges, stripe_payouts_ok: payouts };
  } catch (err) {
    console.error("[stripe-sync] could not read account", potter.stripe_account_id, err);
    return potter;
  }
}
