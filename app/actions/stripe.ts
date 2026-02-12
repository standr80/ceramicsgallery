"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
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

export async function createConnectAccountLink(): Promise<{ error?: string }> {
  const potter = await getCurrentPotter();
  if (!potter) {
    return { error: "You must be logged in to connect Stripe." };
  }

  const supabase = await createClient();
  const stripe = getStripe();
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const returnUrl = `${baseUrl}/dashboard/connect-stripe?success=1`;
  const refreshUrl = `${baseUrl}/dashboard/connect-stripe`;

  try {
    let accountId = potter.stripe_account_id as string | null | undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
        email: undefined,
      });
      accountId = account.id;

      const { error } = await supabase
        .from("potters")
        .update({ stripe_account_id: accountId, updated_at: new Date().toISOString() })
        .eq("id", potter.id);

      if (error) {
        console.error("Failed to save stripe_account_id:", error);
        return { error: "Failed to save your account. Please try again." };
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    redirect(accountLink.url);
  } catch (err) {
    if (err instanceof Error && "digest" in err) {
      throw err;
    }
    console.error("Stripe Connect error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
