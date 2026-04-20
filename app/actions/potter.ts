"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id, slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const name = formData.get("name") as string;
  const biography = formData.get("biography") as string;
  const image = (formData.get("image") as string)?.trim() || null;
  const newSlug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "") || null;
  const newEmail = (formData.get("email") as string)?.trim().toLowerCase() || null;

  if (!name?.trim() || !biography?.trim()) {
    return { error: "Name and biography are required." };
  }

  // Validate slug uniqueness if it changed
  if (newSlug && newSlug !== potter.slug) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: taken } = await admin.from("potters").select("id").eq("slug", newSlug).neq("id", potter.id).maybeSingle();
    if (taken) return { error: "That URL is already taken — please choose a different one." };
  }

  const updates: Record<string, unknown> = {
    name: name.trim(),
    biography: biography.trim(),
    image: image || null,
    updated_at: new Date().toISOString(),
  };
  if (newSlug) updates.slug = newSlug;

  const { error } = await supabase
    .from("potters")
    .update(updates)
    .eq("id", potter.id);

  if (error) return { error: error.message };

  // Update email in Supabase Auth if it changed
  if (newEmail && newEmail !== user.email?.toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
    if (emailError) return { error: `Profile saved but email update failed: ${emailError.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
  if (newSlug && newSlug !== potter.slug) revalidatePath(`/${newSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export interface UrlFields {
  website: string;
  website_about: string;
  website_shop: string;
  website_shop_2: string;
  website_shop_3: string;
  website_courses: string;
  website_courses_2: string;
  website_courses_3: string;
}

export async function updateUrls(urls: UrlFields) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const nullIfEmpty = (v: string) => v?.trim() || null;

  const { error } = await supabase
    .from("potters")
    .update({
      website: nullIfEmpty(urls.website),
      website_about: nullIfEmpty(urls.website_about),
      website_shop: nullIfEmpty(urls.website_shop),
      website_shop_2: nullIfEmpty(urls.website_shop_2),
      website_shop_3: nullIfEmpty(urls.website_shop_3),
      website_courses: nullIfEmpty(urls.website_courses),
      website_courses_2: nullIfEmpty(urls.website_courses_2),
      website_courses_3: nullIfEmpty(urls.website_courses_3),
      updated_at: new Date().toISOString(),
    })
    .eq("id", potter.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/drafts");
  return { success: true };
}
