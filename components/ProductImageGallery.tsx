"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages = images.length > 0 ? images : [""];

  function handleMainClick() {
    if (displayImages.length <= 1) return;
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  }

  const mainImage = displayImages[selectedIndex];
  const hasMultiple = displayImages.length > 1;

  return (
    <div className="space-y-4">
      {/* Main image - large, clickable to cycle through */}
      <button
        type="button"
        onClick={handleMainClick}
        className={`relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100 border border-clay-200/60 text-left ${
          hasMultiple ? "cursor-pointer hover:border-clay-400/60 transition-colors" : "cursor-default"
        }`}
        aria-label={hasMultiple ? `View next image (${selectedIndex + 1} of ${displayImages.length})` : undefined}
      >
        {mainImage && (
          <Image
            src={mainImage}
            alt={productName}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized
          />
        )}
        {hasMultiple && (
          <span className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
            {selectedIndex + 1} / {displayImages.length}
          </span>
        )}
      </button>

      {/* Thumbnail strip - smaller, click to select */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Product image thumbnails">
          {displayImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === selectedIndex
                  ? "border-clay-600 ring-2 ring-clay-600/30"
                  : "border-clay-200/60 hover:border-clay-400/80"
              }`}
            >
              <Image
                src={src}
                alt={`${productName} — view ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
