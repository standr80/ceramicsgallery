import Link from "next/link";
import Image from "next/image";
import type { GalleryPiece } from "@/types/database";
import { penceToDisplay } from "@/lib/stripe";
import { getPublicImageUrl } from "@/lib/utils/images";
import { Vessel } from "@/components/brand/Vessel";

interface Props {
  piece: GalleryPiece;
  showPotter?: boolean;
}

const TILE_BG = ["bg-celadon-light", "bg-clay-200", "bg-terracotta-light/60", "bg-stone-200"];
const TILE_FG = ["#5f7a5c", "#825541", "#9c3f1f", "#4a2c1d"];

function hashIndex(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 4;
}

export function PieceCard({ piece, showPotter }: Props) {
  const href = `/${piece.potter_slug}/${piece.slug}`;
  const i = hashIndex(piece.id);

  return (
    <Link href={href} className="group block">
      <div className={`aspect-[4/5] relative overflow-hidden rounded-t-[999px] rounded-b-2xl ${TILE_BG[i]}`}>
        {piece.cover_path ? (
          <Image
            src={getPublicImageUrl(piece.cover_path)}
            alt={piece.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-end justify-center pb-[12%]">
            <Vessel variant={i} fill={TILE_FG[i]} className="w-1/2 transition-transform duration-500 group-hover:-translate-y-1" />
          </div>
        )}
      </div>
      <div className="pt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight text-ink line-clamp-1 group-hover:text-terracotta transition-colors">
            {piece.title}
          </h3>
          {showPotter && (
            <p className="text-xs uppercase tracking-[0.14em] text-stone-500 mt-1 line-clamp-1">{piece.potter_name}</p>
          )}
        </div>
        {piece.price_pence != null && (
          <p className="text-sm font-semibold text-ink tabular-nums shrink-0 pt-1">{penceToDisplay(piece.price_pence)}</p>
        )}
      </div>
    </Link>
  );
}
