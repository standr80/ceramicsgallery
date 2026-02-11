"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 50) || "potter";
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const biography = formData.get("biography") as string;
  const website = (formData.get("website") as string) || null;

  if (!name?.trim() || !email?.trim() || !password?.trim() || !biography?.trim()) {
    return { error: "Name, email, password and biography are required." };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard` },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Sign up failed. Please try again." };
  }

  const admin = createAdminClient();
  let baseSlug = slugFromName(name);
  let slug = baseSlug;
  let attempt = 0;
  for (;;) {
    const { data: existing } = await admin.from("potters").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}${attempt}`;
  }

  const { error: potterError } = await admin.from("potters").insert({
    auth_user_id: authData.user.id,
    slug,
    name: name.trim(),
    biography: biography.trim(),
    website: website?.trim() || null,
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
  const isAdmin = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(data.user.email?.toLowerCase() ?? "");
  return { redirectTo: isAdmin ? "/admin" : "/dashboard" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
