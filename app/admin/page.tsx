import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PotterActiveToggle } from "@/components/PotterActiveToggle";
import { PotterDeleteButton } from "@/components/PotterDeleteButton";

export default async function AdminPage() {
  const admin = createAdminClient();
  const { data: potters } = await admin
    .from("potters")
    .select("id, slug, name, active")
    .order("name");

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-4">
        Potters
      </h2>
      <p className="text-stone-600 mb-6">
        Inactive potters are hidden from the catalog. Click a name to manage their products.
      </p>
      {!potters?.length ? (
        <p className="text-stone-600">No potters yet.</p>
      ) : (
        <ul className="space-y-3">
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
      )}
    </div>
  );
}
