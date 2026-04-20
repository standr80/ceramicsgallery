import { getAllProducts, getShopFilterOptions } from "@/lib/data";
import { ShopView } from "@/components/shop/ShopView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop | Ceramics Gallery",
  description:
    "Browse handmade pottery from UK ceramicists. Filter by category, potter, and price.",
};

export default async function ShopPage() {
  const products = await getAllProducts();
  const filterOptions = await getShopFilterOptions(products);

  return (
    <div>
      <section className="bg-gradient-to-b from-clay-100 to-clay-50 py-12 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="font-display text-4xl font-semibold text-clay-900 sm:text-5xl">
            Shop
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-stone-600">
            Handmade pottery from our community of UK ceramicists. Every piece is one of a kind.
          </p>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="mx-auto max-w-6xl">
          <ShopView products={products} filterOptions={filterOptions} />
        </div>
      </section>
    </div>
  );
}
