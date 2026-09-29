import { createClient } from "@/lib/supabase/server";
import { draftListingFromImages } from "@/lib/ai/draft-listing";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { imageUrls } = await req.json() as { imageUrls: string[] };
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return Response.json({ error: "No image URLs provided." }, { status: 400 });
  }

  // Validate all URLs are Supabase storage URLs (our own domain)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  for (const url of imageUrls) {
    if (!url.startsWith(supabaseUrl)) {
      return Response.json({ error: "Invalid image source." }, { status: 400 });
    }
  }

  const draft = await draftListingFromImages(imageUrls);
  return Response.json(draft);
}
