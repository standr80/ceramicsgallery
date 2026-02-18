import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductAdminCard } from "@/components/ProductAdminCard";
import { PotterCommissionForm } from "@/components/PotterCommissionForm";
import { AdminPotterProfileForm } from "@/components/AdminPotterProfileForm";
import { SortSelect } from "@/components/SortSelect";
import { PaginationNav } from "@/components/PaginationNav";

export const dynamic = "force-dynamic";

const PER_PAGE = 15;
const SORT_OPTIONS = [
  { value: "name", label: "Alphabetical" },
  { value: "active", label: "Active first" },
  { value: "inactive", label: "Inactive first" },
  { value: "featured", label: "On homepage first" },
  { value: "price", label: "Price" },
];

interface PageProps {
  params: Promise<{ potterId: string }>;
  searchParams: Promise<{ sort?: string; page?: string; tab?: string }>;
}

export default async function AdminPotterPage({ params, searchParams }: PageProps) {
  const { potterId } = await params;
  const { sort = "name", page: pageParam = "1", tab = "products" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const admin = createAdminClient();

  const { data: potter } = await admin
    .from("potters")
    .select("id, slug, name, biography, image, website, active, commission_override_percent")
    .eq("id", potterId)
    .single();

  if (!potter) notFound();

  const { data: defaultRow } = await admin
    .from("settings")
    .select("value")
    .eq("key", "default_commission_percent")
    .single();

  const defaultCommissionPercent = defaultRow
    ? parseFloat(defaultRow.value)
    : 10;

  const { data: allProducts } = await admin
    .from("products")
    .select("id, name, slug, price, image, active, featured")
    .eq("potter_id", potterId)
    .limit(1000);

  const sorted = [...(allProducts ?? [])];
  if (sort === "name") {
    sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  } else if (sort === "active") {
    sorted.sort((a, b) => ((a.active ?? true) === (b.active ?? true) ? 0 : (a.active ?? true) ? -1 : 1));
  } else if (sort === "inactive") {
    sorted.sort((a, b) => ((a.active ?? true) === (b.active ?? true) ? 0 : (a.active ?? true) ? 1 : -1));
  } else if (sort === "featured") {
    sorted.sort((a, b) => ((a.featured ?? false) === (b.featured ?? false) ? 0 : (a.featured ?? false) ? -1 : 1));
  } else if (sort === "price") {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const products = sorted.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const baseUrl = `/admin/potters/${potterId}`;
  const productsParams = new URLSearchParams();
  if (sort !== "name") productsParams.set("sort", sort);
  if (page > 1) productsParams.set("page", String(page));
  const productsUrl = productsParams.toString() ? `${baseUrl}?${productsParams}` : baseUrl;
  const profileUrl = `${baseUrl}?tab=profile`;

  return (
    <div>
      <Link href="/admin" className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block">
        ← Back to potters
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-2">
        {potter.name}
      </h2>
      <nav className="mb-6 border-b border-clay-200/60">
        <ul className="flex gap-6">
          <li>
            <Link
              href={productsUrl}
              className={`block border-b-2 pb-3 text-sm font-medium ${
                tab !== "profile"
                  ? "border-clay-600 text-clay-700"
                  : "border-transparent text-stone-600 hover:text-clay-600"
              }`}
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              href={profileUrl}
              className={`block border-b-2 pb-3 text-sm font-medium ${
                tab === "profile"
                  ? "border-clay-600 text-clay-700"
                  : "border-transparent text-stone-600 hover:text-clay-600"
              }`}
            >
              Profile
            </Link>
          </li>
        </ul>
      </nav>
      {tab === "profile" ? (
        <div className="rounded-lg border border-clay-200/60 bg-stone-50 p-6">
          <h3 className="font-medium text-stone-900 mb-4">Edit potter profile</h3>
          <AdminPotterProfileForm
            potterId={potterId}
            initialName={potter.name}
            initialSlug={potter.slug}
            initialBiography={potter.biography ?? ""}
            initialWebsite={potter.website}
            initialImage={potter.image}
            initialActive={potter.active ?? true}
          />
        </div>
      ) : (
        <>
          <p className="text-stone-600 text-sm mb-4">
            Inactive products are hidden from the catalog. Featured products appear on the home page.
          </p>
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <SortSelect options={SORT_OPTIONS} defaultValue="name" />
            </div>
          )}
          <div className="mb-8 rounded-lg border border-clay-200/60 bg-stone-50 p-4">
            <h3 className="font-medium text-stone-900 mb-2">Commission override</h3>
            <PotterCommissionForm
              potterId={potterId}
              defaultCommissionPercent={isNaN(defaultCommissionPercent) ? 10 : defaultCommissionPercent}
              currentOverride={
                potter.commission_override_percent != null
                  ? Number(potter.commission_override_percent)
                  : null
              }
            />
          </div>
          {total === 0 ? (
            <p className="text-stone-600">No products yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {products.map((p) => (
                  <ProductAdminCard
                    key={p.id}
                    productId={p.id}
                    name={p.name}
                    price={Number(p.price)}
                    image={p.image}
                    active={p.active ?? true}
                    featured={p.featured ?? false}
                  />
                ))}
              </div>
              <PaginationNav
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                perPage={PER_PAGE}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
