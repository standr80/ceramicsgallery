import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/is-admin";
import { runOnboardingScout } from "@/lib/agents/onboarding-scout";

export const maxDuration = 300;

export async function POST(req: Request) {
  // Only admins may trigger this
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const admin = await isAdmin();
  if (!admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let potterId: string;
  try {
    const body = await req.json();
    potterId = body.potterId;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!potterId) {
    return Response.json({ error: "Missing potterId" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: potter } = await adminClient
    .from("potters")
    .select("id, website")
    .eq("id", potterId)
    .single();

  if (!potter) {
    return Response.json({ error: "Potter not found" }, { status: 404 });
  }
  if (!potter.website) {
    return Response.json({ error: "Potter has no website URL set" }, { status: 422 });
  }

  // Fire and forget — respond immediately, crawl in background
  waitUntil(runOnboardingScout(potterId, potter.website));

  return Response.json({ started: true });
}
