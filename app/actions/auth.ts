"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const studioName = (formData.get("studio_name") as string) || null;
  const slug = (formData.get("slug") as string) || toSlug(displayName);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { error: error?.message ?? "Sign-up failed." };

  const admin = createAdminClient();
  const { error: potterError } = await admin.from("potters").insert({
    user_id: data.user.id,
    slug,
    display_name: displayName,
    studio_name: studioName,
    onboarding_step: "profile",
  });

  if (potterError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Could not create potter profile. That URL may be taken." };
  }

  redirect("/dashboard/studio");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard/studio");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
