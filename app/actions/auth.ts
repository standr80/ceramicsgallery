"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedSlug } from "@/lib/reserved-slugs";

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

  if (isReservedSlug(slug)) return { error: "That page address is reserved. Please choose another." };

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (data.user?.email && adminEmails.includes(data.user.email)) {
    const { count } = await createAdminClient()
      .from("potters").select("id", { count: "exact", head: true }).eq("user_id", data.user.id);
    if (!count) redirect("/admin");
  }
  redirect("/dashboard/studio");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function siteOrigin() {
  const { headers } = await import("next/headers");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  // Don't reveal whether the address has an account; only surface rate limits.
  if (error && /rate|seconds/i.test(error.message)) {
    return { error: "Too many requests. Please wait a minute and try again." };
  }
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const password = (formData.get("password") as string) || "";
  const confirm = (formData.get("confirm") as string) || "";
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== confirm) return { error: "The passwords don't match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard/studio?password=updated");
}

function maskEmail(email: string): string {
  const [local, domain = ""] = email.split("@");
  const dot = domain.lastIndexOf(".");
  const name = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  const hide = (s: string) => (s ? s[0] + "••••" : "");
  return `${hide(local)}@${hide(name)}${tld}`;
}

export async function findAccountEmail(formData: FormData) {
  let query = ((formData.get("query") as string) || "").trim();
  if (query.length < 2) return { error: "Enter your page address, name or studio name." };

  // Accept a pasted page URL like ceramicsgallery.co.uk/percy-sludge
  const urlMatch = query.match(/ceramicsgallery\.co\.uk\/([a-z0-9-]+)/i);
  if (urlMatch) query = urlMatch[1];

  const admin = createAdminClient();
  // Strip characters that have meaning in PostgREST filter strings.
  const like = query.replace(/[,()"'\\%_*:]/g, " ").replace(/\s+/g, " ").trim();
  if (!like) return { matches: [] };
  const { data: potters } = await admin
    .from("potters")
    .select("user_id, display_name, studio_name, slug")
    .or(`slug.eq.${toSlug(query) || "-"},display_name.ilike."${like}",studio_name.ilike."${like}"`)
    .limit(3);

  if (!potters || potters.length === 0) return { matches: [] };

  const matches = await Promise.all(
    potters.map(async (p) => {
      const { data } = await admin.auth.admin.getUserById(p.user_id);
      return {
        name: p.studio_name ?? p.display_name,
        slug: p.slug,
        email: data.user?.email ? maskEmail(data.user.email) : null,
      };
    }),
  );
  return { matches: matches.filter((m) => m.email) };
}
