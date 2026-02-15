import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChoosePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmails = process.env.ADMIN_EMAILS ?? "";
  const isAdmin = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(user.email?.toLowerCase() ?? "");

  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-clay-900">
          Where would you like to go?
        </h1>
        <p className="mt-2 text-stone-600">
          You have access to both the admin area and your potter dashboard.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin" className="btn-primary">
            Admin
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Potter dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
