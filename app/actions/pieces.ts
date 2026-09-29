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

export async function updatePiece(pieceId: string, formData: FormData) {
  const potterId = await getMyPotterId();
  if (!potterId) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pieces")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      glaze_notes: (formData.get("glaze_notes") as string) || null,
      price_pence: formData.get("price_pence") ? Number(formData.get("price_pence")) : null,
      height_cm: formData.get("height_cm") ? Number(formData.get("height_cm")) : null,
      width_cm: formData.get("width_cm") ? Number(formData.get("width_cm")) : null,
      collection_available: formData.get("collection_available") === "true",
    })
    .eq("id", pieceId)
    .eq("potter_id", potterId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/studio");
  return { success: true };
}

export async function publishPiece(pieceId: string) {
  const potter = await getMyPotter();
  if (!potter) return { error: "Not authenticated." };
  if (!potter.stripe_charges_ok) return { error: "stripe_not_connected" };
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
