"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

function sanitiseSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "potter";
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  const studioName = (formData.get("studio_name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const biography = (formData.get("biography") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();

  if (!firstName || !lastName || !email || !password || !biography) {
    return { error: "All required fields must be filled in." };
  }

  const displayName = studioName || `${firstName} ${lastName}`;
  const slug = sanitiseSlug(rawSlug || displayName);

  // Guard against a race-condition where the client-side check passed but the
  // slug was taken before the insert.
  const admin = createAdminClient();
  const { data: existing } = await admin.from("potters").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return { error: "That URL is already taken — please choose a different one." };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard` },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Sign up failed. Please try again." };
  }

  const { error: potterError } = await admin.from("potters").insert({
    auth_user_id: authData.user.id,
    slug,
    name: displayName,
    biography,
  });

  if (potterError) {
    return { error: `Account created but profile setup failed: ${potterError.message}` };
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email?.trim() || !password?.trim()) {
    return { error: "Email and password are required." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  const adminEmails = process.env.ADMIN_EMAILS ?? "";
  const isAdminUser = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(data.user.email?.toLowerCase() ?? "");

  const admin = createAdminClient();
  const { data: potter } = await admin
    .from("potters")
    .select("id, force_password_reset")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (potter?.force_password_reset) {
    return { redirectTo: "/change-password" };
  }

  if (isAdminUser) {
    if (potter) {
      return { redirectTo: "/choose" };
    }
    return { redirectTo: "/admin" };
  }

  return { redirectTo: "/dashboard" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  return { success: true };
}

export async function changePasswordAndClearForceReset(formData: FormData) {
  const result = await changePassword(formData);
  if (result && "error" in result) return result;

  const { clearForcePasswordResetForCurrentUser } = await import("@/app/actions/admin");
  await clearForcePasswordResetForCurrentUser();

  redirect("/dashboard");
}
