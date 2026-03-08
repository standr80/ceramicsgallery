import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: potter } = await admin
    .from("potters")
    .select("id, force_password_reset")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!potter?.force_password_reset) {
    redirect("/dashboard");
  }

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-semibold text-clay-900">
          Change your password
        </h1>
        <p className="mt-2 text-stone-600">
          You must set a new password before continuing.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
