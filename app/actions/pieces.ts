"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PieceStatus } from "@/types/database";

async function getMyPotter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("potters")
    .select("id, stripe_charges_ok")
    .eq("user_id", user.id)
    .single();
  return data ?? null;
}

async function getMyPotterId(): Promise<string | null> {
  return (await getMyPotter())?.id ?? null;
}

export async function createPiece(formData: FormData) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pieces")
    .insert({
      potter_id: potterId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      glaze_notes: (formData.get("glaze_notes") as string) || null,
      price_pence: formData.get("price_pence") ? Number(formData.get("price_pence")) : null,
      height_cm: formData.get("height_cm") ? Number(formData.get("height_cm")) : null,
      width_cm: formData.get("width_cm") ? Number(formData.get("width_cm")) : null,
      collection_available: formData.get("collection_available") === "true",
      status: "draft" as PieceStatus,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/studio");
  return { id: data.id };
}

export async function attachImages(pieceId: string, tempPaths: string[], startPosition = 0) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Verify this piece belongs to this potter
  const { data: piece } = await admin
    .from("pieces")
    .select("id")
    .eq("id", pieceId)
    .eq("potter_id", potterId)
    .single();
  if (!piece) return { error: "Not found." };

  const rows: { piece_id: string; position: number; original_path: string }[] = [];
  for (let i = 0; i < tempPaths.length; i++) {
    const tempPath = tempPaths[i];
    const ext = tempPath.split(".").pop();
    const permanentPath = `pieces/${pieceId}/${startPosition + i}.${ext}`;
    const { error: moveErr } = await admin.storage
      .from("piece-images")
      .move(tempPath, permanentPath);
    if (moveErr) {
      // If move fails (e.g. already moved), still record what we have
      rows.push({ piece_id: pieceId, position: startPosition + i, original_path: tempPath });
    } else {
      rows.push({ piece_id: pieceId, position: startPosition + i, original_path: permanentPath });
    }
  }

  if (rows.length > 0) {
    await admin.from("piece_images").insert(rows);
  }

  revalidatePath("/dashboard/studio");
  return { success: true };
}

export async function updatePiece(pieceId: string, formData: FormData) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  // Resolve category_slug to category_id
  const categorySlug = formData.get("category_slug") as string | null;
  let categoryId: number | null = null;
  if (categorySlug) {
    const supabaseAdmin = createAdminClient();
    const { data: cat } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    categoryId = cat?.id ?? null;
  }

  // price_pence field on edit form is in pounds (e.g. "45.00") — convert
  const priceRaw = formData.get("price_pence") as string | null;
  const pricePence = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("pieces")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      glaze_notes: (formData.get("glaze_notes") as string) || null,
      price_pence: pricePence,
      height_cm: formData.get("height_cm") ? Number(formData.get("height_cm")) : null,
      width_cm: formData.get("width_cm") ? Number(formData.get("width_cm")) : null,
      collection_available: formData.get("collection_available") === "true",
      ...(categoryId != null ? { category_id: categoryId } : {}),
    })
    .eq("id", pieceId)
    .eq("potter_id", potterId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/studio");
  revalidatePath(`/dashboard/studio/${pieceId}`);
  return { success: true };
}

export async function publishPiece(pieceId: string) {
  const potter = await getMyPotter();
  if (!potter) return { error: "Not authenticated." };
  const potterId = potter.id;

  const supabase = await createClient();
  const { error } = await supabase
    .from("pieces")
    .update({ status: "live" as PieceStatus, published_at: new Date().toISOString() })
    .eq("id", pieceId)
    .eq("potter_id", potterId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/studio");
  return { success: true };
}

export async function unpublishPiece(pieceId: string) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pieces")
    .update({ status: "draft" as PieceStatus })
    .eq("id", pieceId)
    .eq("potter_id", potterId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/studio");
  return { success: true };
}

export async function deletePieceImage(imageId: string, pieceId: string) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Verify ownership
  const { data: piece } = await admin
    .from("pieces")
    .select("id")
    .eq("id", pieceId)
    .eq("potter_id", potterId)
    .single();
  if (!piece) return { error: "Not found." };

  const { data: img } = await admin
    .from("piece_images")
    .select("original_path, processed_path")
    .eq("id", imageId)
    .eq("piece_id", pieceId)
    .single();

  if (img) {
    await admin.storage.from("piece-images").remove([img.original_path]);
    if (img.processed_path) {
      await admin.storage.from("piece-images").remove([img.processed_path]);
    }
    await admin.from("piece_images").delete().eq("id", imageId);
  }

  revalidatePath(`/dashboard/studio/${pieceId}`);
  return { success: true };
}

export async function deletePiece(pieceId: string) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  const admin = createAdminClient();
  await admin.from("piece_images").delete().eq("piece_id", pieceId);
  const { error } = await admin
    .from("pieces")
    .delete()
    .eq("id", pieceId)
    .eq("potter_id", potterId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/studio");
  return { success: true };
}
