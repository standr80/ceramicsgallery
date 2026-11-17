"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised");
  return createAdminClient();
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function setPotterPublished(potterId: string, published: boolean) {
  const admin = await requireAdmin();
  await admin.from("potters").update({ is_published: published }).eq("id", potterId);
  revalidatePath("/admin", "layout");
}

export async function setPieceStatus(pieceId: string, status: "live" | "draft" | "archived") {
  const admin = await requireAdmin();
  await admin.from("pieces").update({ status }).eq("id", pieceId);
  revalidatePath("/admin", "layout");
}

/** Delete a sign-in that has no potter profile. Refuses admins and accounts with a potter page. */
export async function deleteOrphanAccount(userId: string) {
  const admin = await requireAdmin();
  const { data } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email?.toLowerCase() ?? "";
  if (!data.user || adminEmails().includes(email)) return;

  const { count } = await admin.from("potters").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (count) return;

  await admin.auth.admin.deleteUser(userId);
  console.log(`[admin] deleted orphan account ${userId}`);
  revalidatePath("/admin", "layout");
}

/** Replace the admin's session with the potter's, for support. */
export async function signInAsPotter(potterId: string) {
  const admin = await requireAdmin();
  const { data: potter } = await admin.from("potters").select("user_id, slug").eq("id", potterId).single();
  if (!potter) return;
  const { data: user } = await admin.auth.admin.getUserById(potter.user_id);
  const email = user.user?.email;
  if (!email || adminEmails().includes(email.toLowerCase())) return;

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !link.properties?.hashed_token) throw new Error("Could not create sign-in link");

  const supabase = await createClient();
  await supabase.auth.signOut();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) throw new Error(verifyError.message);
  console.log(`[admin] signed in as potter ${potter.slug}`);
  redirect("/dashboard/studio");
}
