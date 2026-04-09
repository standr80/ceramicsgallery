import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPotter } from "@/lib/get-potter";
import { isAdmin } from "@/lib/is-admin";
import { signOut } from "@/app/actions/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const potter = await getCurrentPotter();
  if (!potter) {
    redirect("/login");
  }
  if (potter.force_password_reset) {
    redirect("/change-password");
  }

  const admin = await isAdmin();

  // Fetch draft count for the Drafts nav badge
  const supabase = await createClient();
  const { count: draftCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("potter_id", potter.id)
    .eq("active", false)
    .eq("source", "onboarding-scout");

  return (
    <div className="py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-clay-900">
              {potter.name}
            </h1>
            <p className="text-sm text-stone-600">Potter dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            {admin && (
              <Link href="/admin" className="btn-secondary text-sm">
                Admin
              </Link>
            )}
            <Link href={`/${potter.slug}`} className="btn-secondary text-sm">
              View your page
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-stone-600 hover:text-clay-600">
                Log out
              </button>
            </form>
          </div>
        </div>
        <DashboardNav draftCount={draftCount ?? 0} />
        {children}
      </div>
    </div>
  );
}
