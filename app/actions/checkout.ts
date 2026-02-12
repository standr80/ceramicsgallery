"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key)
    return {
      error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local",
    };
  return { stripe: new Stripe(key) };
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Full URL for an image path */
function fullImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const base = getBaseUrl().replace(/\/$/, "");
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${base}${path}`;
}

export async function createBuyNowCheckout(
  productId: string,
  potterId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const stripeResult = getStripe();
    if (stripeResult.error) return stripeResult;
    const stripe = "stripe" in stripeResult ? stripeResult.stripe : undefined;
    if (!stripe) return { error: "Stripe is not configured." };

    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, slug, price, currency, image")
      .eq("id", productId)
      .eq("active", true)
      .single();

    if (productError || !product) {
      return { error: "Product not found." };
    }

    const { data: potter, error: potterError } = await supabase
      .from("potters")
      .select("id, slug, name, stripe_account_id")
      .eq("id", potterId)
      .eq("active", true)
      .single();

    if (potterError || !potter) {
      return { error: "Maker not found." };
    }

    if (!potter.stripe_account_id) {
      return {
        error: "This maker hasn't set up payments yet. Please try again later.",
      };
    }
    const baseUrl = getBaseUrl().replace(/\/$/, "");
    const pricePence = Math.round(Number(product.price) * 100);

    if (pricePence < 50) {
      return { error: "Minimum charge is £0.50." };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (product.currency || "gbp").toLowerCase(),
            product_data: {
              name: product.name,
              description: `by ${potter.name}`,
              images: product.image ? [fullImageUrl(product.image)] : undefined,
              metadata: {
                product_id: product.id,
                potter_id: potter.id,
              },
            },
            unit_amount: pricePence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_id: product.id,
        potter_id: potter.id,
        stripe_account_id: potter.stripe_account_id,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${potter.slug}/${product.slug}`,
    });

    if (session.url) {
      return { url: session.url };
    }
    return { error: "Failed to create checkout session." };
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      error: `Something went wrong: ${message}`,
    };
  }
}
