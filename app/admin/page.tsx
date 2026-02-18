import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PotterActiveToggle } from "@/components/PotterActiveToggle";
import { PotterDeleteButton } from "@/components/PotterDeleteButton";
import { SortSelect } from "@/components/SortSelect";
import { PaginationNav } from "@/components/PaginationNav";

const PER_PAGE = 10;
const SORT_OPTIONS = [
  { value: "name", label: "Alphabetical" },
  { value: "active", label: "Active first" },
  { value: "inactive", label: "Inactive first" },
];

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { sort = "name", page: pageParam = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const admin = createAdminClient();
  const { data: allPotters } = await admin
    .from("potters")
    .select("id, slug, name, active")
    .order("name");

  const sorted = [...(allPotters ?? [])];
  if (sort === "active") {
    sorted.sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
  } else if (sort === "inactive") {
    sorted.sort((a, b) => (a.active === b.active ? 0 : a.active ? 1 : -1));
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const potters = sorted.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-4">
        Potters
      </h2>
      <p className="text-stone-600 mb-4">
        Inactive potters are hidden from the catalog. Click a name to manage their products.
      </p>
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <SortSelect options={SORT_OPTIONS} defaultValue="name" />
        </div>
      )}
      {total === 0 ? (
        <p className="text-stone-600">No potters yet.</p>
      ) : (
        <>
          <ul className="space-y-3 mb-6">
            {potters.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-clay-200/60 bg-white p-4"
            >
              <Link
                href={`/admin/potters/${p.id}`}
                className="font-medium text-clay-600 hover:text-clay-700"
              >
                {p.name}
              </Link>
              <div className="flex items-center gap-3">
                <PotterActiveToggle potterId={p.id} active={p.active} />
                <PotterDeleteButton potterId={p.id} potterName={p.name} />
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
    </div>
  );
}
