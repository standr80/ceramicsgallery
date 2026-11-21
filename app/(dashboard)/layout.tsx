import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPotter } from "@/lib/get-potter";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { signOut } from "@/app/actions/auth";
import { publishProfile } from "@/app/actions/potter";

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
              {potter.is_published ? "View my page →" : "Preview my page →"}
            </Link>
            <form action={signOut}>
              <button className="btn-ghost text-sm">Sign out</button>
            </form>
          </div>
        </div>
        <DashboardNav />
      </header>
      {!potter.is_published && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="flex-1 text-sm text-amber-900">
              <strong>Your page isn&apos;t live yet.</strong> Visitors can&apos;t see your profile, pots or courses until you publish.
              Add a photo, a short bio and a pot or two first, then publish. You can keep editing afterwards.
            </p>
            <form action={async () => { "use server"; await publishProfile(); }}>
              <button className="btn-primary text-sm whitespace-nowrap">Publish my page</button>
            </form>
          </div>
        </div>
      )}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
