import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreatePotterProfileForm } from "@/components/CreatePotterProfileForm";

async function ensureAdminAndNoPotter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmails = process.env.ADMIN_EMAILS ?? "";
  const isAdmin = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(user.email?.toLowerCase() ?? "");
  if (!isAdmin) redirect("/admin");

  const admin = createAdminClient();
  const { data: potter } = await admin
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (potter) redirect("/choose");
}

export default async function CreatePotterProfilePage() {
  await ensureAdminAndNoPotter();

  return (
    <div>
      <Link href="/admin" className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block">
        ← Back to admin
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-2">
        Create your potter profile
      </h2>
      <p className="text-stone-600 text-sm mb-6">
        Add a potter profile to your admin account so you can list and sell your own work.
      </p>
      <CreatePotterProfileForm />
    </div>
  );
}
