import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPotter } from "@/lib/get-potter";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { signOut } from "@/app/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-clay-200/60 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-14 items-center justify-between gap-6">
          <Link href="/" className="font-display text-xl font-semibold text-clay-800 hover:text-clay-600 transition-colors shrink-0">
            Ceramics Gallery
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/${potter.slug}`} className="text-stone-500 hover:text-clay-700 transition-colors hidden sm:block">
              View my page →
            </Link>
            <form action={signOut}>
              <button className="btn-ghost text-sm">Sign out</button>
            </form>
          </div>
        </div>
        <DashboardNav />
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
