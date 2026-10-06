import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Potter } from "@/types/database";

export async function getCurrentPotter(): Promise<Potter | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Admin client so the owner can read their private columns (e.g. contact_email).
  const { data } = await createAdminClient()
    .from("potters")
    .select("*")
    .eq("user_id", user.id)
    .single();
  return data ?? null;
}
