import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/data/pieces";
import { penceToDisplay } from "@/lib/stripe";
import { EnquiryButton } from "@/components/potter/EnquiryButton";
import { DemoNotice } from "@/components/potter/DemoNotice";
import { PieceGallery } from "@/components/piece/PieceGallery";
import { JsonLd, SITE } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ potterSlug: string; pieceSlug: string }> }

const clip = (text: string, max: number) => {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t.replace(/[.!]?$/, ".");
  return t.slice(0, t.lastIndexOf(" ", max)).replace(/[,;:.]$/, "") + "…";
};

type PiecePotter = {
  id: string; slug: string; display_name: string; studio_name: string | null;
  stripe_charges_ok: boolean; is_demo: boolean; is_published: boolean;
};

// Shared by the page and its metadata, so the database is only asked once per request.
// Accepts the piece's slug, or its id for old links (the page then redirects to the slug).
const getPiece = cache(async (potterSlug: string, slugOrId: string) => {
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (!isId && !/^[a-z0-9-]{1,80}$/.test(slugOrId)) return null;
  const supabase = await createClient();
  const { data: piece } = await supabase
    .from("pieces")
    .select("*, potters!inner(id, slug, display_name, studio_name, stripe_charges_ok, is_demo, is_published)")
    .eq(isId ? "id" : "slug", slugOrId)
    .eq("potters.slug", potterSlug)
    .in("status", ["live", "sold"])
    .single();
  if (!piece) return null;
  const { data: images } = await supabase
    .from("piece_images")
    .select("*")
    .eq("piece_id", piece.id)
    .order("position");
  const potter = piece.potters as PiecePotter;
  const photos = (images ?? []).map((img, i, all) => ({
    url: getPublicImageUrl(img.processed_path ?? img.original_path),
    alt: img.alt_text || (all.length > 1 ? `${piece.title}, photo ${i + 1} of ${all.length}` : piece.title),
  }));
  return { piece, potter, photos };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { potterSlug, pieceSlug } = await params;
  const data = await getPiece(potterSlug, pieceSlug);
  if (!data) return {};
  const { piece, potter, photos } = data;
  const maker = potter.studio_name ?? potter.display_name;
  const price = piece.price_pence != null ? ` ${penceToDisplay(piece.price_pence)}.` : "";
  const description = (piece.description
    ? clip(piece.description, 130)
    : `Handmade ${piece.title.toLowerCase()} by ${maker}.`) + price;
  const url = `/${potter.slug}/${piece.slug}`;
  return {
    title: `${piece.title} by ${maker} | Ceramics Gallery`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${piece.title} by ${maker}`, description, url, images: photos.slice(0, 1).map((p) => p.url) },
    robots: potter.is_demo || !potter.is_published ? { index: false } : undefined,
  };
}

export default async function PiecePage({ params }: Props) {
  const { potterSlug, pieceSlug } = await params;
  const data = await getPiece(potterSlug, pieceSlug);
  if (!data) notFound();
  const { piece, potter, photos } = data;
  if (pieceSlug !== piece.slug) permanentRedirect(`/${potter.slug}/${piece.slug}`);
  const imageUrls = photos.map((p) => p.url);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: piece.title,
    description: piece.description ?? undefined,
    image: imageUrls,
    url: `${SITE}/${potter.slug}/${piece.slug}`,
    brand: { "@type": "Brand", name: potter.studio_name ?? potter.display_name },
    ...(piece.price_pence != null && {
      offers: {
        "@type": "Offer",
        price: (piece.price_pence / 100).toFixed(2),
        priceCurrency: "GBP",
        availability: piece.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    }),
  };
  const crumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Potters", item: `${SITE}/potters` },
      { "@type": "ListItem", position: 2, name: potter.studio_name ?? potter.display_name, item: `${SITE}/${potter.slug}` },
      { "@type": "ListItem", position: 3, name: piece.title },
    ],
  };

  return (
    <div className="py-12 px-4">
      {!potter.is_demo && <JsonLd data={productLd} />}
      <JsonLd data={crumbsLd} />
      <div className="mx-auto max-w-5xl">
        <nav className="text-sm text-stone-600 mb-6">
          <Link href={`/${potterSlug}`} className="hover:text-clay-700 transition-colors">
            {potter.studio_name ?? potter.display_name}
          </Link>
          {" / "}
          <span className="text-stone-600">{piece.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <PieceGallery urls={imageUrls} alts={photos.map((p) => p.alt)} title={piece.title} />

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
              <p className="text-sm text-stone-600">
                {[piece.height_cm && `H ${piece.height_cm}cm`, piece.width_cm && `W ${piece.width_cm}cm`]
                  .filter(Boolean)
                  .join(" × ")}
              </p>
            )}

            {potter.is_demo ? (
              <DemoNotice />
            ) : piece.status === "sold" ? (
              <div className="card p-4 text-center text-stone-500">This piece has been sold.</div>
            ) : (
              <div className="flex items-center gap-3">
                <EnquiryButton
                  potterId={potter.id}
                  potterName={potter.studio_name ?? potter.display_name}
                  pieceTitle={piece.title}
                />
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
                      This potter doesn&apos;t currently accept online payment. Send them a message to arrange buying this piece.
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
