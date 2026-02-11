import Link from "next/link";
import { getCurrentPotter } from "@/lib/get-potter";
import { isAdmin } from "@/lib/is-admin";
import { HeaderNav } from "@/components/HeaderNav";

export async function Header() {
  const [potter, admin] = await Promise.all([getCurrentPotter(), isAdmin()]);

  return (
    <header className="border-b border-clay-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-clay-800 hover:text-clay-600 transition-colors shrink-0"
          >
            Ceramics Gallery
          </Link>
          <HeaderNav isAdmin={!!admin} isPotter={!!potter} />
        </div>
      </div>
    </header>
  );
}
