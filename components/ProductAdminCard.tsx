"use client";

import { useState } from "react";
import { setProductActive, setProductFeatured } from "@/app/actions/admin";

interface ProductAdminCardProps {
  productId: string;
  name: string;
  price: number;
  image: string;
  active: boolean;
  featured: boolean;
}

export function ProductAdminCard({
  productId,
  name,
  price,
  image,
  active: initialActive,
  featured: initialFeatured,
}: ProductAdminCardProps) {
  const [active, setActive] = useState(initialActive);
  const [featured, setFeatured] = useState(initialFeatured);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleActiveToggle() {
    setLoading("active");
    const result = await setProductActive(productId, !active);
    setLoading(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setActive(!active);
  }

  async function handleFeaturedToggle() {
    setLoading("featured");
    const result = await setProductFeatured(productId, !featured);
    setLoading(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setFeatured(!featured);
  }

  return (
    <div className="rounded-lg border border-clay-200/60 bg-white overflow-hidden">
      <div className="aspect-square relative bg-stone-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-stone-900">{name}</h3>
        <p className="text-sm text-stone-600">£{price.toFixed(2)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleActiveToggle}
            disabled={loading !== null}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              active
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-stone-200 text-stone-600 hover:bg-stone-300"
            }`}
          >
            {loading === "active" ? "…" : active ? "Active" : "Inactive"}
          </button>
          <button
            type="button"
            onClick={handleFeaturedToggle}
            disabled={loading !== null}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              featured
                ? "bg-clay-100 text-clay-800 hover:bg-clay-200"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {loading === "featured" ? "…" : featured ? "On home page" : "Not on home"}
          </button>
        </div>
      </div>
    </div>
  );
}
