import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/is-admin";
import { runProfileScout } from "@/lib/agents/profile-scout";
import { runShopScout } from "@/lib/agents/shop-scout";
import { runCoursesScout } from "@/lib/agents/courses-scout";

export const maxDuration = 300;

type ScoutType = "profile" | "shop" | "courses";

export async function POST(req: Request) {
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
  let scoutType: ScoutType;
  try {
    const body = await req.json();
    potterId = body.potterId;
    scoutType = body.scoutType;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!potterId) return Response.json({ error: "Missing potterId" }, { status: 400 });
  if (!["profile", "shop", "courses"].includes(scoutType)) {
    return Response.json({ error: "Invalid scoutType" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: potter } = await adminClient
    .from("potters")
    .select("id, website, website_about, website_shop, website_courses")
    .eq("id", potterId)
    .single();

  if (!potter) return Response.json({ error: "Potter not found" }, { status: 404 });

  if (scoutType === "profile") {
    if (!potter.website && !potter.website_about) {
      return Response.json({ error: "No website or about URL set for this potter" }, { status: 422 });
    }
    waitUntil(
      runProfileScout(
        potterId,
        potter.website ?? potter.website_about!,
        potter.website_about
      )
    );
  } else if (scoutType === "shop") {
    if (!potter.website_shop) {
      return Response.json({ error: "No shop URL set for this potter" }, { status: 422 });
    }
    waitUntil(runShopScout(potterId, potter.website_shop));
  } else if (scoutType === "courses") {
    if (!potter.website_courses) {
      return Response.json({ error: "No courses URL set for this potter" }, { status: 422 });
    }
    waitUntil(runCoursesScout(potterId, potter.website_courses));
  }

  return Response.json({ started: true });
}
