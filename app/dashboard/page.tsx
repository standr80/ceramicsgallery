import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";
import { SortSelect } from "@/components/SortSelect";
import { PaginationNav } from "@/components/PaginationNav";

const PER_PAGE = 10;
const SORT_OPTIONS = [
  { value: "name", label: "Alphabetical" },
  { value: "date", label: "Date added" },
  { value: "price", label: "Price" },
  { value: "featured", label: "Featured" },
];

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const potter = await getCurrentPotter();
  if (!potter) return null;

  const { sort = "date", page: pageParam = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, price, image, featured, created_at")
    .eq("potter_id", potter.id);

  if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "price") {
    query = query.order("price", { ascending: true });
  } else if (sort === "featured") {
    query = query.order("featured", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: allProducts } = await query;
  const total = allProducts?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const products = (allProducts ?? []).slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  return (
    <div>
      {!potter.stripe_account_id && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-amber-900 text-sm">
            <Link href="/dashboard/connect-stripe" className="font-medium underline hover:no-underline">
              Connect your Stripe account
            </Link>
            {" "}to receive payments when your pottery sells.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="font-display text-xl font-semibold text-clay-900">
          Your products
        </h2>
        {total > 0 && (
          <div className="flex items-center gap-3">
            <SortSelect options={SORT_OPTIONS} defaultValue="date" />
          </div>
        )}
      </div>
      {total === 0 ? (
        <p className="text-stone-600 mb-6">
          You haven&apos;t added any products yet. Add your first piece to start selling.
        </p>
      ) : (
        <>
          <ul className="space-y-3 mb-6">
            {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-clay-200/60 bg-white p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-stone-100 overflow-hidden shrink-0">
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <span className="font-medium text-stone-900">{p.name}</span>
                  {p.featured && (
                    <span className="ml-2 text-xs text-clay-600">Featured</span>
                  )}
                  <p className="text-sm text-stone-600">
                    £{Number(p.price).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/products/${p.id}`}
                  className="text-sm font-medium text-clay-600 hover:text-clay-700"
                >
                  Edit
                </Link>
                <Link
                  href={`/${potter.slug}/${p.slug}`}
                  className="text-sm text-stone-600 hover:text-clay-600"
                >
                  View →
                </Link>
              </div>
            </li>
          ))}
          </ul>
          <PaginationNav
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            perPage={PER_PAGE}
          />
        </>
      )}
      <Link href="/dashboard/add-product" className="btn-primary mt-6 inline-block">
        Add product
      </Link>
    </div>
  );
}
