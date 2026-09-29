import Link from "next/link";
import { getGalleryPieces, getAllPotters } from "@/lib/data/potters";
import { PieceCard } from "@/components/piece/PieceCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [pieces, potters] = await Promise.all([
    getGalleryPieces(6),
    getAllPotters(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-clay-100 to-clay-50 py-24 px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-5xl sm:text-6xl font-semibold text-clay-900">
            Ceramics Gallery
          </h1>
          <p className="mt-4 text-xl text-stone-600">
            Handmade pottery, directly from British potters.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/shop" className="btn-primary text-base px-8 py-3">Browse the shop</Link>
            <Link href="/signup" className="btn-secondary text-base px-8 py-3">Join as a potter</Link>
          </div>
        </div>
      </section>

      {/* Featured pieces */}
      {pieces.length > 0 && (
        <section className="py-16 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-display text-2xl font-semibold text-clay-900">Latest pieces</h2>
              <Link href="/shop" className="text-sm text-clay-600 hover:text-clay-800 font-medium">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {pieces.map((piece) => (
                <PieceCard key={piece.id} piece={piece} showPotter />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Potters */}
      {potters.length > 0 && (
        <section className="py-16 px-4 bg-stone-50/80">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-2xl font-semibold text-clay-900 mb-8">Our potters</h2>
            <div className="flex flex-wrap gap-3">
              {potters.map((potter) => (
                <Link
                  key={potter.id}
                  href={`/${potter.slug}`}
                  className="px-5 py-2.5 bg-white border border-clay-200 rounded-full text-sm font-medium text-stone-700 hover:border-clay-500 hover:text-clay-800 transition-colors"
                >
                  {potter.studio_name ?? potter.display_name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-2xl font-semibold text-clay-900">Are you a potter?</h2>
          <p className="mt-2 text-stone-600">
            List your work, take payments, and reach buyers across the UK — in minutes.
          </p>
          <Link href="/signup" className="btn-primary mt-6 inline-block text-base px-8 py-3">
            Get started free
          </Link>
        </div>
      </section>
    </div>
  );
}
