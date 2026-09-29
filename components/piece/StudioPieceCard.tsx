import Link from "next/link";
import type { Piece } from "@/types/database";
import { penceToDisplay } from "@/lib/stripe";

interface Props {
  piece: Piece;
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  live: "Live",
  reserved: "Reserved",
  sold: "Sold",
  archived: "Archived",
};

const statusStyle: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600",
  live: "bg-green-100 text-green-700",
  reserved: "bg-yellow-100 text-yellow-700",
  sold: "bg-clay-100 text-clay-700",
  archived: "bg-stone-100 text-stone-400",
};

export function StudioPieceCard({ piece }: Props) {
  return (
    <Link href={`/dashboard/studio/${piece.id}`} className="group block card overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-clay-100 flex items-center justify-center text-clay-300">
        <svg width="48" height="60" viewBox="0 0 64 80" aria-hidden="true">
          <path d="M24 6h16v6c0 4 12 10 12 30 0 18-9 32-20 32S12 60 12 42c0-20 12-26 12-30z" fill="currentColor" />
        </svg>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900 group-hover:text-clay-700 transition-colors line-clamp-2 text-sm leading-snug">
            {piece.title}
          </h3>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[piece.status] ?? ""}`}>
            {statusLabel[piece.status] ?? piece.status}
          </span>
        </div>
        {piece.price_pence != null && (
          <p className="text-clay-700 font-semibold text-sm">{penceToDisplay(piece.price_pence)}</p>
        )}
      </div>
    </Link>
  );
}
