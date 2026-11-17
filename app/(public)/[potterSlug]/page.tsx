import { notFound } from "next/navigation";
import { getPotterBySlug, getPiecesForPotter } from "@/lib/data/potters";
import { PieceCard } from "@/components/piece/PieceCard";
import { getPublicImageUrl } from "@/lib/utils/images";
import { EnquiryButton } from "@/components/potter/EnquiryButton";
import { Vessel } from "@/components/brand/Vessel";

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
        <div className="w-28 h-32 rounded-t-[999px] rounded-b-2xl bg-celadon-light flex items-end justify-center pb-4 mb-2">
          <Vessel variant={1} fill="#5f7a5c" className="w-12" />
        </div>
        <p className="kicker">In the kiln</p>
        <h1 className="font-display text-5xl text-ink">Coming soon</h1>
        <p className="text-stone-500 max-w-sm">
          {potter.studio_name ?? potter.display_name} is still setting up their page. Check back soon.
        </p>
        <a href="/" className="mt-4 text-sm font-medium text-clay-700 underline underline-offset-2">
          Browse the gallery →
        </a>
      </div>
    );
  }

  const name = potter.studio_name ?? potter.display_name;
  return (
    <div>
      <section className="border-b border-ink/10 bg-clay-100/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 grid md:grid-cols-[auto_1fr] gap-10 items-start">
          <div className="relative w-40 h-48 sm:w-48 sm:h-56 rounded-t-[999px] rounded-b-3xl overflow-hidden bg-terracotta-light/60 shrink-0">
            {potter.avatar_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getPublicImageUrl(potter.avatar_path)} alt={potter.display_name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-end justify-center pb-6">
                <Vessel variant={0} fill="#9c3f1f" className="w-1/2" />
              </div>
            )}
          </div>
          <div>
            <p className="kicker">{potter.location_label ?? "British potter"}</p>
            <h1 className="font-display text-6xl sm:text-7xl text-ink leading-[0.95] mt-3">{name}</h1>
            {potter.studio_name && <p className="text-ink/55 mt-2">by {potter.display_name}</p>}
            {potter.headline && <p className="font-display italic text-2xl text-terracotta mt-4">{potter.headline}</p>}
            {potter.bio && <p className="text-ink/70 mt-5 max-w-2xl leading-relaxed text-lg">{potter.bio}</p>}
            <div className="mt-7">
              <EnquiryButton potterId={potter.id} potterName={name} label="Send a message" />
            </div>

            {(potter.studio_address || potter.opening_hours) && (
              <div className="mt-8 pt-6 border-t border-ink/10 grid gap-6 sm:grid-cols-2 max-w-xl text-sm">
                {potter.studio_address && (
                  <div>
                    <p className="kicker text-ink/50 mb-2">Visit the studio</p>
                    <p className="text-ink/80 whitespace-pre-line">{potter.studio_address}</p>
                  </div>
                )}
                {potter.opening_hours && (
                  <div>
                    <p className="kicker text-ink/50 mb-2">Opening hours</p>
                    <p className="text-ink/80 whitespace-pre-line">{potter.opening_hours}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-baseline gap-4 mb-10 border-b border-ink/15 pb-5">
          <span className="font-display italic text-terracotta text-xl">{pieces.length}</span>
          <h2 className="font-display text-4xl text-ink leading-none">{pieces.length === 1 ? "Piece" : "Pieces"} for sale</h2>
        </div>
        {pieces.length === 0 ? (
          <p className="text-ink/55">Nothing listed just now. Send {name} a message to ask about commissions.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
