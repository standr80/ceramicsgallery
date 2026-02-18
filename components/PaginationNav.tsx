"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

export function PaginationNav({
  currentPage,
  totalPages,
  totalItems,
  perPage,
}: PaginationNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-4 pt-4"
      aria-label="Pagination"
    >
      <p className="text-sm text-stone-600">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildUrl(currentPage - 1)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            currentPage <= 1
              ? "pointer-events-none border-stone-200 text-stone-400"
              : "border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
          aria-disabled={currentPage <= 1}
        >
          Previous
        </Link>
        <span className="flex items-center gap-1">
          {(() => {
            const show: number[] = [];
            const maxVisible = 7;
            if (totalPages <= maxVisible) {
              for (let i = 1; i <= totalPages; i++) show.push(i);
            } else {
              show.push(1);
              const start = Math.max(2, currentPage - 1);
              const end = Math.min(totalPages - 1, currentPage + 1);
              if (start > 2) show.push(-1);
              for (let i = start; i <= end; i++) if (i > 1 && i < totalPages) show.push(i);
              if (end < totalPages - 1) show.push(-2);
              if (totalPages > 1) show.push(totalPages);
            }
            return show.map((p) =>
              p < 0 ? (
                <span key={p} className="px-2 text-stone-400">
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={buildUrl(p)}
                  className={`min-w-[2.25rem] rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                    p === currentPage
                      ? "border-clay-500 bg-clay-600 text-white"
                      : "border-stone-300 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {p}
                </Link>
              )
            );
          })()}
        </span>
        <Link
          href={buildUrl(currentPage + 1)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            currentPage >= totalPages
              ? "pointer-events-none border-stone-200 text-stone-400"
              : "border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
          aria-disabled={currentPage >= totalPages}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
