import { createClient } from "@/lib/supabase/server";
import type { Potter, GalleryPiece } from "@/types/database";

export async function getPotterBySlug(slug: string): Promise<Potter | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("potters")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data ?? null;
}

export async function getAllPotters(): Promise<Potter[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("potters")
    .select("*")
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
