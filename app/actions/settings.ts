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

export async function updateDefaultCommission(formData: FormData) {
  const authError = await ensureAdmin();
  if (authError) return authError;

  const raw = formData.get("default_commission_percent");
  const value = typeof raw === "string" ? parseFloat(raw) : NaN;
  if (isNaN(value) || value < 0 || value > 100) {
    return { error: "Enter a valid percentage (0–100)." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("settings")
    .upsert(
      { key: "default_commission_percent", value: String(value) },
      { onConflict: "key" }
    );

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}
