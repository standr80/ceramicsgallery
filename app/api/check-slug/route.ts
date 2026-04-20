import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase();

  if (!slug) {
    return Response.json({ available: false, error: "No slug provided" });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("potters")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return Response.json({ available: !data });
}
