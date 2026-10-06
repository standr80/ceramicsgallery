import { createClient } from "@/lib/supabase/server";
import type { Potter, GalleryPiece } from "@/types/database";

// contact_email is not readable by anon/authenticated roles; keep it out of public selects.
export type PublicPotter = Omit<Potter, "contact_email">;
const PUBLIC_POTTER_COLUMNS =
  "id, user_id, slug, display_name, studio_name, headline, bio, bio_source_audio, avatar_path, location_label, instagram, website_url, studio_address, opening_hours, stripe_account_id, stripe_charges_ok, stripe_payouts_ok, plan, commission_bps, onboarding_step, is_published, created_at, updated_at";

export async function getPotterBySlug(slug: string): Promise<PublicPotter | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("potters")
    .select(PUBLIC_POTTER_COLUMNS)
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getAllPotters(): Promise<PublicPotter[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("potters")
    .select(PUBLIC_POTTER_COLUMNS)
    .eq("is_published", true)
    .order("display_name");
  return data ?? [];
}

export async function getAllPotterSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("potters")
    .select("slug")
    .eq("is_published", true);
  return (data ?? []).map((r) => r.slug);
}

export async function getGalleryPieces(limit = 24): Promise<GalleryPiece[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_pieces")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getPiecesForPotter(potterSlug: string): Promise<GalleryPiece[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_pieces")
    .select("*")
    .eq("potter_slug", potterSlug)
    .order("published_at", { ascending: false });
  return data ?? [];
}
