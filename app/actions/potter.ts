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
  const website = (formData.get("website") as string)?.trim() || null;
  const image = (formData.get("image") as string)?.trim() || null;

  if (!name?.trim() || !biography?.trim()) {
    return { error: "Name and biography are required." };
  }

  const { error } = await supabase
    .from("potters")
    .update({
      name: name.trim(),
      biography: biography.trim(),
      website: website || null,
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
