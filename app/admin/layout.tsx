import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/is-admin";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="border-b border-clay-200/60 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-14 items-center justify-between gap-6">
          <Link href="/admin" className="font-display text-xl font-semibold text-clay-800">
            Ceramics Gallery <span className="text-sm font-sans text-stone-500">admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-stone-500 hover:text-clay-700 hidden sm:block">View site →</Link>
            <form action={signOut}>
              <button className="btn-ghost text-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
