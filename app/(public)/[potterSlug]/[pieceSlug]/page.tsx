import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/data/pieces";
import { penceToDisplay } from "@/lib/stripe";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ potterSlug: string; pieceSlug: string }> }

export default async function PiecePage({ params }: Props) {
  const { potterSlug, pieceSlug: pieceId } = await params;

  const supabase = await createClient();
  const { data: piece } = await supabase
    .from("pieces")
    .select("*, potters!inner(slug, display_name, studio_name, contact_email, stripe_charges_ok)")
    .eq("id", pieceId)
    .eq("potters.slug", potterSlug)
    .in("status", ["live", "sold"])
    .single();

  if (!piece) notFound();

  const { data: images } = await supabase
    .from("piece_images")
    .select("*")
    .eq("piece_id", pieceId)
    .order("position");

  const potter = piece.potters as {
    slug: string;
    display_name: string;
    studio_name: string | null;
    contact_email: string | null;
    stripe_charges_ok: boolean;
  };
  const enquiryHref = potter.contact_email
    ? `mailto:${potter.contact_email}?subject=${encodeURIComponent(`Enquiry about "${piece.title}"`)}`
    : null;
  const coverPath = images?.[0]?.processed_path ?? images?.[0]?.original_path;
  const coverUrl = coverPath ? getPublicImageUrl(coverPath) : null;

  return (
    <div className="py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <nav className="text-sm text-stone-400 mb-6">
          <Link href={`/${potterSlug}`} className="hover:text-clay-700 transition-colors">
            {potter.studio_name ?? potter.display_name}
          </Link>
          {" / "}
          <span className="text-stone-600">{piece.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl overflow-hidden bg-clay-100 flex items-center justify-center">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={piece.title} className="w-full h-full object-cover" />
            ) : (
              <svg width="80" height="100" viewBox="0 0 64 80" aria-hidden="true">
                <path d="M24 6h16v6c0 4 12 10 12 30 0 18-9 32-20 32S12 60 12 42c0-20 12-26 12-30z" fill="#d4b599" />
              </svg>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-3xl font-semibold text-clay-900">{piece.title}</h1>
              <p className="text-stone-500 mt-1">
                by{" "}
                <Link href={`/${potterSlug}`} className="hover:text-clay-700 transition-colors">
                  {potter.studio_name ?? potter.display_name}
                </Link>
              </p>
            </div>

            {piece.price_pence != null && (
              <p className="text-2xl font-semibold text-clay-700">{penceToDisplay(piece.price_pence)}</p>
            )}

            {piece.description && (
              <p className="text-stone-600 leading-relaxed">{piece.description}</p>
            )}

            {piece.glaze_notes && (
              <p className="text-sm text-stone-500 italic">{piece.glaze_notes}</p>
            )}

            {(piece.height_cm || piece.width_cm) && (
              <p className="text-sm text-stone-400">
                {[piece.height_cm && `H ${piece.height_cm}cm`, piece.width_cm && `W ${piece.width_cm}cm`]
                  .filter(Boolean)
                  .join(" × ")}
              </p>
            )}

            {piece.status === "sold" ? (
              <div className="card p-4 text-center text-stone-500">This piece has been sold.</div>
            ) : (
              <div className="flex items-center gap-3">
                {enquiryHref ? (
                  <a href={enquiryHref} className="btn-primary inline-flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
                    </svg>
                    Email enquiry
                  </a>
                ) : (
                  <Link href={`/${potterSlug}`} className="btn-primary">Contact the potter</Link>
                )}
                {!potter.stripe_charges_ok && (
                  <span className="relative group">
                    <button
                      type="button"
                      aria-describedby="payment-tip"
                      className="w-6 h-6 rounded-full border border-stone-300 text-stone-500 text-xs font-semibold flex items-center justify-center hover:border-clay-400 hover:text-clay-700 focus:outline-none focus:ring-2 focus:ring-clay-300"
                    >
                      i
                      <span className="sr-only">Payment information</span>
                    </button>
                    <span
                      id="payment-tip"
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-stone-800 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    >
                      This potter doesn&apos;t currently accept online payment. Email them to arrange buying this piece.
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
