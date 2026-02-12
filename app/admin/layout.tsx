import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/is-admin";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-clay-900">
              Admin
            </h1>
            <p className="text-sm text-stone-600">Manage potters</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-secondary text-sm">
              Back to site
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-stone-600 hover:text-clay-600">
                Log out
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
