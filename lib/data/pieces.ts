import { createClient } from "@/lib/supabase/server";
import type { Piece, PieceImage } from "@/types/database";

export type PieceWithCover = Piece & { cover_path: string | null };

export async function getMyPieces(): Promise<PieceWithCover[]> {
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
    .select("*, piece_images(original_path, processed_path, position)")
    .eq("potter_id", potter.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((p) => {
    const imgs = (p.piece_images ?? []) as { original_path: string; processed_path: string | null; position: number }[];
    imgs.sort((a, b) => a.position - b.position);
    const cover = imgs[0];
    return {
      ...p,
      piece_images: undefined,
      cover_path: cover ? (cover.processed_path ?? cover.original_path) : null,
    } as PieceWithCover;
  });
}

export async function getPieceWithImages(
  pieceId: string
): Promise<{ piece: Piece & { category_slug: string | null }; images: PieceImage[] } | null> {
  const supabase = await createClient();
  const { data: piece } = await supabase
    .from("pieces")
    .select("*, categories(slug)")
    .eq("id", pieceId)
    .single();
  if (!piece) return null;
  const { data: images } = await supabase
    .from("piece_images")
    .select("*")
    .eq("piece_id", pieceId)
    .order("position");
  const categoriesData = piece.categories as { slug: string } | null;
  return {
    piece: { ...piece, category_slug: categoriesData?.slug ?? null },
    images: images ?? [],
  };
}

export { getPublicImageUrl } from "@/lib/utils/images";
