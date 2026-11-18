import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink text-paper mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-10">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="max-w-sm">
            <p className="font-display text-4xl">Ceramics Gallery</p>
            <p className="text-paper/60 mt-3 leading-relaxed">
              Handmade pottery, straight from British studios.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
            <p className="kicker text-terracotta-light col-span-1">Buy</p>
            <p className="kicker text-terracotta-light col-span-1">Make</p>
            <Link href="/shop" className="text-paper/75 hover:text-paper">Shop</Link>
            <Link href="/signup" className="text-paper/75 hover:text-paper">Join as a potter</Link>
            <Link href="/potters" className="text-paper/75 hover:text-paper">Potters</Link>
            <Link href="/login" className="text-paper/75 hover:text-paper">Potter sign in</Link>
            <Link href="/courses" className="text-paper/75 hover:text-paper">Courses</Link>
            <Link href="/news" className="text-paper/75 hover:text-paper col-start-1">News</Link>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t border-paper/15 flex flex-col sm:flex-row justify-between gap-2 text-xs text-paper/70">
          <p>© {new Date().getFullYear()} Ceramics Gallery · ceramicsgallery.co.uk</p>
          <p>Prices and availability set by each potter.</p>
        </div>
      </div>
    </footer>
  );
}
