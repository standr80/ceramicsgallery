"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function startStripeConnect(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: potter } = await supabase
    .from("potters")
    .select("id, stripe_account_id, display_name")
    .eq("user_id", user.id)
    .single();
  if (!potter) redirect("/login");

  const stripe = getStripe();
  let accountId = potter.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { name: potter.display_name },
    });
    accountId = account.id;
    await supabase
      .from("potters")
      .update({ stripe_account_id: accountId })
      .eq("id", potter.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ceramicsgallery.co.uk";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/dashboard/connect-stripe`,
    return_url: `${siteUrl}/dashboard/connect-stripe?connected=1`,
    type: "account_onboarding",
  });

  redirect(link.url);
}
