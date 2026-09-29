import { notFound } from "next/navigation";
import { getPotterBySlug, getPiecesForPotter } from "@/lib/data/potters";
import { PieceCard } from "@/components/piece/PieceCard";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ potterSlug: string }> }

export async function generateMetadata({ params }: Props) {
  const { potterSlug } = await params;
  const potter = await getPotterBySlug(potterSlug);
  if (!potter) return {};
  return {
    title: `${potter.studio_name ?? potter.display_name} | Ceramics Gallery`,
    description: potter.headline ?? potter.bio?.slice(0, 160) ?? "",
  };
}

export default async function PotterPage({ params }: Props) {
  const { potterSlug } = await params;
  const [potter, pieces] = await Promise.all([
    getPotterBySlug(potterSlug),
    getPiecesForPotter(potterSlug),
  ]);
  if (!potter) notFound();

  if (!potter.is_published) {
    return (
      <div className="py-24 px-4 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-clay-100 flex items-center justify-center mb-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9A4527" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold text-clay-900">Coming soon</h1>
        <p className="text-stone-500 max-w-sm">
          {potter.studio_name ?? potter.display_name} is still setting up their page. Check back soon.
        </p>
        <a href="/" className="mt-4 text-sm font-medium text-clay-700 underline underline-offset-2">
          Browse the gallery →
        </a>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-semibold text-clay-900">
            {potter.studio_name ?? potter.display_name}
          </h1>
          {potter.headline && <p className="text-xl text-stone-600 mt-2">{potter.headline}</p>}
          {potter.location_label && <p className="text-sm text-stone-400 mt-2">{potter.location_label}</p>}
          {potter.bio && <p className="text-stone-600 mt-4 max-w-2xl leading-relaxed">{potter.bio}</p>}
        </div>

        {pieces.length === 0 ? (
          <p className="text-stone-500">No pieces listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
