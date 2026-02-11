import { createClient } from "@/lib/supabase/server";

export async function getCurrentPotter() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: potter } = await supabase
      .from("potters")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    return potter;
  } catch {
    return null;
  }
}
