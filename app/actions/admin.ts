"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 50) || "potter";
}

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

export async function deletePotter(potterId: string) {
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

  const { error } = await admin.from("potters").delete().eq("id", potterId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/potters/${potterId}`);
  return { success: true };
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

export async function createPotterProfileForAdmin(formData: FormData) {
  const authError = await ensureAdmin();
  if (authError) return authError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "You already have a potter profile." };
  }

  const name = (formData.get("name") as string)?.trim();
  const biography = (formData.get("biography") as string)?.trim();
  const website = (formData.get("website") as string)?.trim() || null;

  if (!name || !biography) {
    return { error: "Name and biography are required." };
  }

  let baseSlug = slugFromName(name);
  let slug = baseSlug;
  let attempt = 0;
  for (;;) {
    const { data: taken } = await admin.from("potters").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    attempt++;
    slug = `${baseSlug}${attempt}`;
  }

  const { error } = await admin.from("potters").insert({
    auth_user_id: user.id,
    slug,
    name,
    biography,
    website: website || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/create-potter-profile");
  redirect("/choose");
}
