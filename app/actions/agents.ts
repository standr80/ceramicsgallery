"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function publishDraft(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id, slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const { error } = await supabase
    .from("products")
    .update({ active: true, source: "manual" })
    .eq("id", productId)
    .eq("potter_id", potter.id)
    .eq("source", "onboarding-scout");

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/drafts");
  return { success: true };
}

export async function discardDraft(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("potter_id", potter.id)
    .eq("source", "onboarding-scout");

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/drafts");
  return { success: true };
}

export async function publishCourseDraft(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const { error } = await supabase
    .from("courses")
    .update({ active: true, source: "manual" })
    .eq("id", courseId)
    .eq("potter_id", potter.id)
    .eq("source", "onboarding-scout");

  if (error) return { error: error.message };

  revalidatePath("/courses");
  revalidatePath("/dashboard/drafts");
  return { success: true };
}

export async function discardCourseDraft(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("potter_id", potter.id)
    .eq("source", "onboarding-scout");

  if (error) return { error: error.message };

  revalidatePath("/dashboard/drafts");
  return { success: true };
}
