"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { publishDraft, discardDraft } from "@/app/actions/agents";

interface DraftProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  category: string | null;
}

export function DraftProductCard({ product }: { product: DraftProduct }) {
  const [status, setStatus] = useState<"idle" | "publishing" | "discarding" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePublish() {
    setStatus("publishing");
    const result = await publishDraft(product.id);
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("done");
    }
  }

  async function handleDiscard() {
    if (!confirm(`Discard "${product.name}"? This cannot be undone.`)) return;
    setStatus("discarding");
    const result = await discardDraft(product.id);
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("done");
    }
  }

  if (status === "done") return null;

  const priceLabel =
    product.price === 0
      ? "Price not set"
      : `${product.currency} ${Number(product.price).toFixed(2)}`;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-stone-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400 text-sm">
            No image
          </div>
        )}
        {product.price === 0 && (
          <span className="absolute top-2 left-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded">
            Price needed
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
            {product.category ?? "Uncategorised"}
          </p>
          <h3 className="font-semibold text-stone-900 leading-snug">{product.name}</h3>
          <p className="text-sm text-stone-600 mt-1 line-clamp-2">{product.description}</p>
        </div>
        <p className="text-stone-900 font-medium text-sm">{priceLabel}</p>

        {status === "error" && (
          <p className="text-red-600 text-xs">{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handlePublish}
            disabled={status !== "idle"}
            className="flex-1 bg-stone-900 text-white text-sm px-3 py-2 rounded hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {status === "publishing" ? "Publishing…" : "Publish"}
          </button>
          <Link
            href={`/dashboard/products/${product.id}`}
            className="flex-1 text-center border border-stone-300 text-stone-700 text-sm px-3 py-2 rounded hover:bg-stone-50 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDiscard}
            disabled={status !== "idle"}
            className="px-3 py-2 text-red-600 text-sm rounded border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            title="Discard draft"
          >
            {status === "discarding" ? "…" : "Discard"}
          </button>
        </div>
      </div>
    </div>
  );
}
