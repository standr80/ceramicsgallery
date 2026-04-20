"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!title || !description) return { error: "Title and description are required." };

  const price = parseFloat(formData.get("price") as string);
  const maxParticipantsRaw = formData.get("max_participants") as string;

  const { error } = await supabase.from("courses").insert({
    potter_id: potter.id,
    title,
    description,
    type: (formData.get("type") as string)?.trim() || null,
    duration: (formData.get("duration") as string)?.trim() || null,
    price: isNaN(price) ? 0 : price,
    currency: ((formData.get("currency") as string)?.trim().toUpperCase()) || "GBP",
    skill_level: (formData.get("skill_level") as string) || null,
    location: (formData.get("location") as string)?.trim() || null,
    start_date: (formData.get("start_date") as string) || null,
    max_participants: maxParticipantsRaw ? parseInt(maxParticipantsRaw, 10) : null,
    url: (formData.get("url") as string)?.trim() || null,
    active: true,
    source: "manual",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id, slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("potter_id", potter.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  revalidatePath(`/${potter.slug}`);
  return { success: true };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!title || !description) return { error: "Title and description are required." };

  const price = parseFloat(formData.get("price") as string);
  const maxParticipantsRaw = formData.get("max_participants") as string;

  const { error } = await supabase
    .from("courses")
    .update({
      title,
      description,
      type: (formData.get("type") as string)?.trim() || null,
      duration: (formData.get("duration") as string)?.trim() || null,
      price: isNaN(price) ? 0 : price,
      currency: ((formData.get("currency") as string)?.trim().toUpperCase()) || "GBP",
      skill_level: (formData.get("skill_level") as string) || null,
      location: (formData.get("location") as string)?.trim() || null,
      start_date: (formData.get("start_date") as string) || null,
      max_participants: maxParticipantsRaw ? parseInt(maxParticipantsRaw, 10) : null,
      url: (formData.get("url") as string)?.trim() || null,
    })
    .eq("id", courseId)
    .eq("potter_id", potter.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/drafts");
  return { success: true };
}
