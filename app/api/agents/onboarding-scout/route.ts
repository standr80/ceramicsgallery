import { waitUntil } from "@vercel/functions";
import { headers } from "next/headers";
import { runOnboardingScout } from "@/lib/agents/onboarding-scout";

export const maxDuration = 300;

export async function POST(req: Request) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization") ?? "";
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[onboarding-scout] SUPABASE_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    console.warn("[onboarding-scout] Unauthorised webhook attempt");
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  let payload: { record?: { id?: string; website?: string } };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const potterId = payload?.record?.id;
  const websiteUrl = payload?.record?.website;

  if (!potterId) {
    return Response.json({ error: "Missing record.id" }, { status: 400 });
  }

  if (!websiteUrl) {
    console.log(`[onboarding-scout] Potter ${potterId} has no website, skipping.`);
    return Response.json({ received: true, skipped: true });
  }

  waitUntil(runOnboardingScout(potterId, websiteUrl));

  return Response.json({ received: true });
}
