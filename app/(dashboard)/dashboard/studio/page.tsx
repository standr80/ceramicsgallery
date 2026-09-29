import { getCurrentPotter } from "@/lib/get-potter";
import { getMyPieces } from "@/lib/data/pieces";
import { StudioPieceCard } from "@/components/piece/StudioPieceCard";
import { StudioAddButton } from "@/components/piece/StudioAddButton";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [potter, pieces] = await Promise.all([getCurrentPotter(), getMyPieces()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold text-clay-900">Your pots</h1>
        <StudioAddButton />
      </div>

      {!potter?.stripe_charges_ok && (
        <div className="card p-4 mb-6 flex items-center justify-between gap-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">Connect Stripe to take payments for your pieces.</p>
          <a href="/dashboard/connect-stripe" className="btn-primary text-sm shrink-0">Connect now</a>
        </div>
      )}

      {pieces.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-500 mb-4">You haven't added any pots yet.</p>
          <StudioAddButton label="Add your first pot" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {pieces.map((piece) => (
            <StudioPieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  );
}
