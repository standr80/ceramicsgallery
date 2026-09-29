"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const websiteUrl = formData.get("website_url") as string | null;
  if (websiteUrl) {
    try {
      const parsed = new URL(websiteUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: "Website URL must start with http:// or https://" };
      }
    } catch {
      return { error: "Invalid website URL." };
    }
  }

  const { error } = await supabase
    .from("potters")
    .update({
      display_name: formData.get("display_name") as string,
      studio_name: (formData.get("studio_name") as string) || null,
      headline: (formData.get("headline") as string) || null,
      bio: (formData.get("bio") as string) || null,
      location_label: (formData.get("location_label") as string) || null,
      instagram: (formData.get("instagram") as string) || null,
      website_url: websiteUrl || null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?saved=1");
}

export async function publishProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("potters")
    .update({ is_published: true })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/profile");
  return { success: true };
}
