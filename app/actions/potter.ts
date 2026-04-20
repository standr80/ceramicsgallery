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

  if (!name?.trim() || !biography?.trim()) {
    return { error: "Name and biography are required." };
  }

  const { error } = await supabase
    .from("potters")
    .update({
      name: name.trim(),
      biography: biography.trim(),
      image: image || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", potter.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
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
