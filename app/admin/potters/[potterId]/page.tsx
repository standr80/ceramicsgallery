import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductAdminCard } from "@/components/ProductAdminCard";
import { PotterCommissionForm } from "@/components/PotterCommissionForm";

interface PageProps {
  params: Promise<{ potterId: string }>;
}

export default async function AdminPotterPage({ params }: PageProps) {
  const { potterId } = await params;
  const admin = createAdminClient();

  const { data: potter } = await admin
    .from("potters")
    .select("id, slug, name, commission_override_percent")
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

  const { data: products } = await admin
    .from("products")
    .select("id, name, slug, price, image, active, featured")
    .eq("potter_id", potterId)
    .order("name");

  return (
    <div>
      <Link href="/admin" className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block">
        ← Back to potters
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-2">
        {potter.name}
      </h2>
      <p className="text-stone-600 text-sm mb-6">
        Inactive products are hidden from the catalog. Featured products appear on the home page.
      </p>
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
      {!products?.length ? (
        <p className="text-stone-600">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      )}
    </div>
  );
}
