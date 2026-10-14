"use client";

import { useState } from "react";

export function PieceGallery({ urls, title }: { urls: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="aspect-square rounded-2xl overflow-hidden bg-clay-100 flex items-center justify-center">
        <svg width="80" height="100" viewBox="0 0 64 80" aria-hidden="true">
          <path d="M24 6h16v6c0 4 12 10 12 30 0 18-9 32-20 32S12 60 12 42c0-20 12-26 12-30z" fill="#d4b599" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-2xl overflow-hidden bg-clay-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[active]}
          alt={urls.length > 1 ? `${title}, photo ${active + 1} of ${urls.length}` : title}
          className="w-full h-full object-cover"
        />
      </div>
      {urls.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`aspect-square rounded-xl overflow-hidden bg-clay-100 border-2 transition-colors ${
                i === active ? "border-clay-600" : "border-transparent hover:border-clay-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
