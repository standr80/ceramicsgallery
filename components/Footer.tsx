import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-clay-200/60 bg-stone-100/80 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="font-display text-lg text-stone-600">
            Ceramics Gallery — www.ceramicsgallery.co.uk
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-stone-600 hover:text-clay-600 text-sm">
              Home
            </Link>
            <Link href="/signup" className="text-stone-600 hover:text-clay-600 text-sm">
              Potter signup
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-stone-500 text-sm">
          Handmade pottery from British ceramacists. Prices and availability subject to change.
        </p>
      </div>
    </footer>
  );
}
