"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" };
  return { stripe: new Stripe(key) };
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function createConnectAccountLink(): Promise<
  { url?: string; error?: string }
> {
  try {
    const potter = await getCurrentPotter();
    if (!potter) {
      return { error: "You must be logged in to connect Stripe." };
    }

    const stripeResult = getStripe();
    if (stripeResult.error) return stripeResult;

    const supabase = await createClient();
    const stripe = stripeResult.stripe;
    const baseUrl = getBaseUrl().replace(/\/$/, "");
    const returnUrl = `${baseUrl}/dashboard/connect-stripe?success=1`;
    const refreshUrl = `${baseUrl}/dashboard/connect-stripe`;

    let accountId = potter.stripe_account_id as string | null | undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
      });
      accountId = account.id;

      const { error } = await supabase
        .from("potters")
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", potter.id);

      if (error) {
        console.error("Failed to save stripe_account_id:", error);
        return {
          error: `Failed to save your account: ${error.message}. Have you run the migration to add stripe_account_id to potters?`,
        };
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  } catch (err) {
    console.error("Stripe Connect error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      error: `Something went wrong: ${message}. On Vercel, check that STRIPE_SECRET_KEY and other env vars are set in Project Settings → Environment Variables.`,
    };
  }
}
