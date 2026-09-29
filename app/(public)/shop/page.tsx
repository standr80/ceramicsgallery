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
    <div className="py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-8">Shop</h1>
        {pieces.length === 0 ? (
          <p className="text-stone-500">No pieces listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} showPotter />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
