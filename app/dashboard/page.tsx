import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";

export default async function DashboardPage() {
  const potter = await getCurrentPotter();
  if (!potter) return null;

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, image, featured")
    .eq("potter_id", potter.id)
    .order("created_at", { ascending: false });

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
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-4">
        Your products
      </h2>
      {!products?.length ? (
        <p className="text-stone-600 mb-6">
          You haven&apos;t added any products yet. Add your first piece to start selling.
        </p>
      ) : (
        <ul className="space-y-3 mb-8">
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
      )}
      <Link href="/dashboard/add-product" className="btn-primary">
        Add product
      </Link>
    </div>
  );
}
