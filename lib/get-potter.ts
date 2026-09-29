import { createClient } from "@/lib/supabase/server";
import type { Potter } from "@/types/database";

export async function getCurrentPotter(): Promise<Potter | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("potters")
    .select("*")
    .eq("user_id", user.id)
    .single();
  return data ?? null;
}
