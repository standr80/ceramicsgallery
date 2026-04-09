import { waitUntil } from "@vercel/functions";
import { headers } from "next/headers";
import { runProfileScout } from "@/lib/agents/profile-scout";
import { runShopScout } from "@/lib/agents/shop-scout";
import { runCoursesScout } from "@/lib/agents/courses-scout";

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

  let payload: {
    record?: {
      id?: string;
      website?: string;
      website_about?: string;
      website_shop?: string;
      website_courses?: string;
    };
  };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const potterId = payload?.record?.id;
  if (!potterId) {
    return Response.json({ error: "Missing record.id" }, { status: 400 });
  }

  const { website, website_about, website_shop, website_courses } = payload.record ?? {};

  const tasks: Promise<unknown>[] = [];

  if (website || website_about) {
    tasks.push(runProfileScout(potterId, website ?? website_about!, website_about));
  }
  if (website_shop) {
    tasks.push(runShopScout(potterId, website_shop));
  }
  if (website_courses) {
    tasks.push(runCoursesScout(potterId, website_courses));
  }

  if (tasks.length === 0) {
    console.log(`[onboarding-scout] Potter ${potterId} has no URLs, skipping.`);
    return Response.json({ received: true, skipped: true });
  }

  waitUntil(Promise.all(tasks));

  return Response.json({ received: true });
}
