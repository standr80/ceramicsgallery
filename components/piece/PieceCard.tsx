import Link from "next/link";
import Image from "next/image";
import type { GalleryPiece } from "@/types/database";
import { penceToDisplay } from "@/lib/stripe";
import { getPublicImageUrl } from "@/lib/utils/images";

interface Props {
  piece: GalleryPiece;
  showPotter?: boolean;
}

export function PieceCard({ piece, showPotter }: Props) {
  const href = `/${piece.potter_slug}/${piece.id}`;
  const imgSrc = piece.cover_path ? getPublicImageUrl(piece.cover_path) : "/images/placeholder.svg";

  return (
    <Link href={href} className="group block card overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-clay-100 overflow-hidden">
        <Image
          src={imgSrc}
          alt={piece.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 group-hover:text-clay-700 transition-colors line-clamp-1">
          {piece.title}
        </h3>
        {showPotter && (
          <p className="text-sm text-stone-500 mt-0.5">{piece.potter_name}</p>
        )}
        {piece.price_pence != null && (
          <p className="text-clay-700 font-semibold mt-1">{penceToDisplay(piece.price_pence)}</p>
        )}
      </div>
    </Link>
  );
}
