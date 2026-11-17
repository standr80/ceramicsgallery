import Link from "next/link";
import { getCurrentPotter } from "@/lib/get-potter";
import { isAdmin } from "@/lib/is-admin";
import { signOut } from "@/app/actions/auth";

export async function Header() {
  const [potter, admin] = await Promise.all([getCurrentPotter(), isAdmin()]);

  return (
    <header className="border-b border-ink/10 bg-paper/85 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl font-semibold text-ink hover:text-terracotta transition-colors shrink-0">
          Ceramics <em className="font-normal text-terracotta">Gallery</em>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/shop" className="text-ink/70 hover:text-terracotta transition-colors hidden sm:block">Shop</Link>
          <Link href="/courses" className="text-ink/70 hover:text-terracotta transition-colors hidden sm:block">Courses</Link>
          {potter ? (
            <>
              <Link href="/dashboard/studio" className="text-ink/70 hover:text-terracotta transition-colors">Studio</Link>
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
            <Link href="/admin" className="text-xs text-ink/50 hover:text-terracotta">Admin</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
