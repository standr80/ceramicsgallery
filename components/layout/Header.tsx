import Link from "next/link";
import { getCurrentPotter } from "@/lib/get-potter";
import { isAdmin } from "@/lib/is-admin";
import { signOut } from "@/app/actions/auth";

export async function Header() {
  const [potter, admin] = await Promise.all([getCurrentPotter(), isAdmin()]);

  return (
    <header className="border-b border-clay-200/60 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl font-semibold text-clay-800 hover:text-clay-600 transition-colors shrink-0">
          Ceramics Gallery
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/shop" className="text-stone-600 hover:text-clay-700 transition-colors hidden sm:block">Shop</Link>
          <Link href="/courses" className="text-stone-600 hover:text-clay-700 transition-colors hidden sm:block">Courses</Link>
          {potter ? (
            <>
              <Link href="/dashboard/studio" className="text-stone-600 hover:text-clay-700 transition-colors">Studio</Link>
              <form action={signOut}>
                <button className="btn-ghost text-sm">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link href="/signup" className="btn-primary text-sm">Join as a potter</Link>
            </>
          )}
          {admin && (
            <Link href="/admin" className="text-xs text-clay-500 hover:text-clay-700">Admin</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
