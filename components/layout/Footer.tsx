import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-clay-200/60 bg-stone-100/80 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-6">
        <p className="font-display text-lg text-stone-600">
          Ceramics Gallery — www.ceramicsgallery.co.uk
        </p>
        <div className="flex gap-6 text-sm text-stone-500">
          <Link href="/shop" className="hover:text-clay-700 transition-colors">Shop</Link>
          <Link href="/courses" className="hover:text-clay-700 transition-colors">Courses</Link>
          <Link href="/signup" className="hover:text-clay-700 transition-colors">Join as a potter</Link>
        </div>
      </div>
      <p className="text-center text-stone-400 text-xs pb-6">
        Handmade pottery from British ceramicists. Prices and availability subject to change.
      </p>
    </footer>
  );
}
