"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised");
  return createAdminClient();
}

export async function setPotterPublished(potterId: string, published: boolean) {
  const admin = await requireAdmin();
  await admin.from("potters").update({ is_published: published }).eq("id", potterId);
  revalidatePath("/admin");
}

export async function setPieceStatus(pieceId: string, status: "live" | "draft" | "archived") {
  const admin = await requireAdmin();
  await admin.from("pieces").update({ status }).eq("id", pieceId);
  revalidatePath("/admin");
}
