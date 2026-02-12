"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated" };

  const adminEmails = process.env.ADMIN_EMAILS ?? "";
  const allowed = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(user.email.toLowerCase())) {
    return { error: "Access denied" };
  }
  return null;
}

export async function setPotterActive(potterId: string, active: boolean) {
  const authError = await ensureAdmin();
  if (authError) return authError;

  const admin = createAdminClient();
  const { data: potter, error: fetchError } = await admin
    .from("potters")
    .select("slug")
    .eq("id", potterId)
    .single();

  if (fetchError || !potter) {
    return { error: "Potter not found" };
  }

  const { error } = await admin
    .from("potters")
    .update({ active })
    .eq("id", potterId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/potters/${potterId}`);
  return { success: true };
}

export async function setPotterCommissionOverride(
  potterId: string,
  commissionOverridePercent: number | null
) {
  const authError = await ensureAdmin();
  if (authError) return authError;

  if (commissionOverridePercent !== null) {
    if (
      isNaN(commissionOverridePercent) ||
      commissionOverridePercent < 0 ||
      commissionOverridePercent > 100
    ) {
      return { error: "Enter a valid percentage (0–100)." };
    }
  }

  const admin = createAdminClient();
  const { data: potter, error: fetchError } = await admin
    .from("potters")
    .select("slug")
    .eq("id", potterId)
    .single();

  if (fetchError || !potter) {
    return { error: "Potter not found" };
  }

  const { error } = await admin
    .from("potters")
    .update({ commission_override_percent: commissionOverridePercent })
    .eq("id", potterId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/potters/${potterId}`);
  return { success: true };
}

export async function setProductActive(productId: string, active: boolean) {
  const authError = await ensureAdmin();
  if (authError) return authError;

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, potter_id")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Product not found" };

  const { error } = await admin
    .from("products")
    .update({ active })
    .eq("id", productId);

  if (error) return { error: error.message };

  const { data: potter } = await admin
    .from("potters")
    .select("slug")
    .eq("id", product.potter_id)
    .single();

  revalidatePath("/");
  if (potter) revalidatePath(`/${potter.slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/potters/${product.potter_id}`);
  return { success: true };
}

export async function setProductFeatured(productId: string, featured: boolean) {
  const authError = await ensureAdmin();
  if (authError) return authError;

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, potter_id")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Product not found" };

  const { error } = await admin
    .from("products")
    .update({ featured })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/potters/${product.potter_id}`);
  return { success: true };
}
