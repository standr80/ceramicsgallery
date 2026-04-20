"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ShopProduct } from "@/lib/data";

const PER_PAGE = 24;

interface ShopViewProps {
  products: ShopProduct[];
  filterOptions: {
    categories: string[];
    potters: { slug: string; name: string }[];
  };
}

type PriceRange = "" | "under-50" | "50-150" | "over-150";
type PriceSort = "newest" | "asc" | "desc";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(price);
}

export function ShopView({ products, filterOptions }: ShopViewProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [potterFilter, setPotterFilter] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange>("");
  const [priceSort, setPriceSort] = useState<PriceSort>("newest");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);

  function clearFilters() {
    setCategoryFilter("");
    setPotterFilter("");
    setPriceRange("");
    setPriceSort("newest");
    setFeaturedOnly(false);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = [...products];

    if (categoryFilter) result = result.filter((p) => p.category === categoryFilter);
    if (potterFilter) result = result.filter((p) => p.potterSlug === potterFilter);
    if (featuredOnly) result = result.filter((p) => p.featured);

    if (priceRange === "under-50") result = result.filter((p) => p.price < 50);
    else if (priceRange === "50-150") result = result.filter((p) => p.price >= 50 && p.price <= 150);
    else if (priceRange === "over-150") result = result.filter((p) => p.price > 150);

    if (priceSort === "asc") result.sort((a, b) => a.price - b.price);
    else if (priceSort === "desc") result.sort((a, b) => b.price - a.price);
    // "newest" keeps default DB order

    return result;
  }, [products, categoryFilter, potterFilter, priceRange, priceSort, featuredOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function handleFilterChange(fn: () => void) {
    fn();
    setPage(1);
  }

  const hasActiveFilters =
    categoryFilter || potterFilter || priceRange || priceSort !== "newest" || featuredOnly;

  return (
    <div className="space-y-8">
      {/* ── Filters ──────────────────────────────────── */}
      <section className="rounded-xl border border-clay-200/60 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-xl font-semibold text-stone-900">Filter</h2>
          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-clay-600 hover:text-clay-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-category" className="block text-sm font-medium text-stone-700 mb-1">
              Category
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => handleFilterChange(() => setCategoryFilter(e.target.value))}
              className="input-field w-full"
            >
              <option value="">All categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-potter" className="block text-sm font-medium text-stone-700 mb-1">
              Potter
            </label>
            <select
              id="filter-potter"
              value={potterFilter}
              onChange={(e) => handleFilterChange(() => setPotterFilter(e.target.value))}
              className="input-field w-full"
            >
              <option value="">All potters</option>
              {filterOptions.potters.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-price" className="block text-sm font-medium text-stone-700 mb-1">
              Price range
            </label>
            <select
              id="filter-price"
              value={priceRange}
              onChange={(e) => handleFilterChange(() => setPriceRange(e.target.value as PriceRange))}
              className="input-field w-full"
            >
              <option value="">Any price</option>
              <option value="under-50">Under £50</option>
              <option value="50-150">£50 – £150</option>
              <option value="over-150">Over £150</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort-price" className="block text-sm font-medium text-stone-700 mb-1">
              Sort by
            </label>
            <select
              id="sort-price"
              value={priceSort}
              onChange={(e) => handleFilterChange(() => setPriceSort(e.target.value as PriceSort))}
              className="input-field w-full"
            >
              <option value="newest">Newest first</option>
              <option value="asc">Price: low to high</option>
              <option value="desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {/* Featured toggle */}
        <div className="mt-4 flex items-center gap-2">
          <input
            id="featured-only"
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => handleFilterChange(() => setFeaturedOnly(e.target.checked))}
            className="h-4 w-4 rounded border-stone-300 text-clay-600 focus:ring-clay-500"
          />
          <label htmlFor="featured-only" className="text-sm font-medium text-stone-700 cursor-pointer">
            Featured pieces only
          </label>
        </div>
      </section>

      {/* ── Results count ─────────────────────────────── */}
      <div className="flex items-baseline justify-between">
        <p className="text-stone-600 text-sm">
          <span className="font-semibold text-stone-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "piece" : "pieces"} found
          {currentPage > 1 && ` — page ${currentPage} of ${totalPages}`}
        </p>
        {filtered.length > PER_PAGE && (
          <p className="text-xs text-stone-400">Showing {PER_PAGE} per page</p>
        )}
      </div>

      {/* ── Product grid ──────────────────────────────── */}
      {paginated.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 py-20 text-center text-stone-400">
          <p className="font-medium">No products match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm text-clay-600 hover:text-clay-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginated.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-stone-400">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p as number)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === p
                        ? "bg-clay-600 text-white"
                        : "border border-stone-300 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ShopProductCard({ product }: { product: ShopProduct }) {
  const productHref = `/${product.potterSlug}/${product.slug}`;
  const potterHref = `/${product.potterSlug}`;

  return (
    <article className="group rounded-xl overflow-hidden bg-white border border-clay-200/60 flex flex-col">
      <Link href={productHref} className="block aspect-square relative bg-stone-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />
        {product.featured && (
          <span className="absolute top-2 left-2 rounded-full bg-clay-600 px-2 py-0.5 text-xs font-medium text-white">
            Featured
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <Link
          href={potterHref}
          className="text-xs font-medium text-clay-600 hover:text-clay-700 uppercase tracking-wide"
        >
          {product.potterName}
        </Link>
        <h3 className="font-display font-semibold text-stone-900 leading-snug">
          <Link href={productHref} className="hover:text-clay-600 transition-colors">
            {product.name}
          </Link>
        </h3>
        {product.category && (
          <p className="text-xs text-stone-400">{product.category}</p>
        )}
        <p className="mt-auto pt-2 font-semibold text-clay-700">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  );
}
