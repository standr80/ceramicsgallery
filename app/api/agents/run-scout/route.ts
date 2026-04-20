import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runProfileScout } from "@/lib/agents/profile-scout";
import { runShopScout } from "@/lib/agents/shop-scout";
import { runCoursesScout } from "@/lib/agents/courses-scout";

export const maxDuration = 300;

type ScoutType = "profile" | "shop" | "courses";

const SHOP_URL_KEYS = ["website_shop", "website_shop_2", "website_shop_3"] as const;
const COURSES_URL_KEYS = ["website_courses", "website_courses_2", "website_courses_3"] as const;

export async function POST(req: Request) {
  // Auth: must be a logged-in potter
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  let scoutType: ScoutType;
  let url: string;
  try {
    const body = await req.json();
    scoutType = body.scoutType;
    url = body.url?.trim();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });
  if (!["profile", "shop", "courses"].includes(scoutType)) {
    return Response.json({ error: "Invalid scoutType" }, { status: 400 });
  }

  // Fetch potter via admin client (bypasses RLS)
  const admin = createAdminClient();
  const { data: potter } = await admin
    .from("potters")
    .select(
      "id, website, website_about, website_shop, website_shop_2, website_shop_3, website_courses, website_courses_2, website_courses_3"
    )
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return Response.json({ error: "Potter not found" }, { status: 404 });

  // Validate the requested URL is actually saved for this potter and matches the scout type
  const potterUrlsForType: (string | null)[] =
    scoutType === "profile"
      ? [potter.website, potter.website_about]
      : scoutType === "shop"
      ? SHOP_URL_KEYS.map((k) => potter[k])
      : COURSES_URL_KEYS.map((k) => potter[k]);

  if (!potterUrlsForType.includes(url)) {
    return Response.json(
      { error: "URL does not match any saved URL for this scout type" },
      { status: 422 }
    );
  }

  // Run the appropriate scout synchronously so we can return the result
  let result: { success?: boolean; inserted?: number; error?: string };

  if (scoutType === "profile") {
    const isAbout = url === potter.website_about;
    result = await runProfileScout(
      potter.id,
      url,
      isAbout ? url : undefined
    );
  } else if (scoutType === "shop") {
    result = await runShopScout(potter.id, url);
  } else {
    result = await runCoursesScout(potter.id, url);
  }

  if (result.error) {
    return Response.json({ error: result.error }, { status: 422 });
  }

  return Response.json({ success: true, inserted: result.inserted ?? null });
}
