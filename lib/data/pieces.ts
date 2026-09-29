import { createClient } from "@/lib/supabase/server";
import type { Piece, PieceImage } from "@/types/database";

export async function getMyPieces(): Promise<Piece[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!potter) return [];
  const { data } = await supabase
    .from("pieces")
    .select("*")
    .eq("potter_id", potter.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPieceWithImages(
  pieceId: string
): Promise<{ piece: Piece; images: PieceImage[] } | null> {
  const supabase = await createClient();
  const { data: piece } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", pieceId)
    .single();
  if (!piece) return null;
  const { data: images } = await supabase
    .from("piece_images")
    .select("*")
    .eq("piece_id", pieceId)
    .order("position");
  return { piece, images: images ?? [] };
}

export function getPublicImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/piece-images/${path}`;
}
