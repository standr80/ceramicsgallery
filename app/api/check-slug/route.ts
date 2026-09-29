import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    return Response.json({ available: false, reason: "invalid" });
  }
  const admin = createAdminClient();
  const { data } = await admin.from("potters").select("id").eq("slug", slug).maybeSingle();
  return Response.json({ available: !data });
}
