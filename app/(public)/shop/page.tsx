import { getGalleryPieces } from "@/lib/data/potters";
import { PieceCard } from "@/components/piece/PieceCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop | Ceramics Gallery",
  description: "Browse handmade pottery from British potters.",
};

export default async function ShopPage() {
  const pieces = await getGalleryPieces(48);

  return (
    <div className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 border-b border-ink/15 pb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">The shop</p>
            <h1 className="font-display text-6xl sm:text-7xl text-ink leading-none mt-3">Every pot, <em className="text-terracotta font-normal">one of one.</em></h1>
          </div>
          <p className="text-ink/60 text-sm">{pieces.length} {pieces.length === 1 ? "piece" : "pieces"} available</p>
        </div>
        {pieces.length === 0 ? (
          <p className="text-stone-500">No pieces listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} showPotter />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
