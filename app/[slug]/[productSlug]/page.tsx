import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlugs, getAllProductPaths } from "@/lib/data";
import { buildAddToCartUrl } from "@/lib/foxycart";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { BuyNowButton } from "@/components/BuyNowButton";
import { createBuyNowCheckout } from "@/app/actions/checkout";

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateStaticParams() {
  const paths = await getAllProductPaths();
  return paths.map(({ slug, productSlug }) => ({ slug, productSlug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const result = await getProductBySlugs(slug, productSlug);
  if (!result) return { title: "Product not found" };
  const { product, potter } = result;
  return {
    title: `${product.name} | ${potter.name} | Ceramics Gallery`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | ${potter.name}`,
      description: product.description.slice(0, 160),
      images: [product.image],
    },
  };
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(price);
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const result = await getProductBySlugs(slug, productSlug);
  if (!result) notFound();

  const { product, potter } = result;
  const allImages = product.images?.length ? product.images : [product.image];

  return (
    <div>
      {/* Breadcrumb */}
      <section className="border-b border-clay-200/60 bg-white py-4 px-4">
        <div className="mx-auto max-w-6xl">
          <nav className="text-sm text-stone-600" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/" className="hover:text-clay-600">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/${potter.slug}`} className="hover:text-clay-600">
                  {potter.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-stone-900" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Product detail */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Main image + gallery */}
            <ProductImageGallery images={allImages} productName={product.name} />

            {/* Info */}
            <div>
              <Link
                href={`/${potter.slug}`}
                className="text-sm font-medium text-clay-600 hover:text-clay-700"
              >
                {potter.name}
              </Link>
              <h1 className="font-display mt-1 text-3xl font-semibold text-stone-900 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-4 text-2xl font-semibold text-clay-700">
                {formatPrice(product.price, product.currency)}
              </p>
              <p className="mt-4 text-stone-600 leading-relaxed">
                {product.description}
              </p>
              {product.descriptionExtended && (
                <div className="mt-6 border-t border-clay-200/60 pt-6">
                  <h2 className="font-display text-lg font-semibold text-stone-900">
                    About this piece
                  </h2>
                  <p className="mt-2 text-stone-600 leading-relaxed whitespace-pre-line">
                    {product.descriptionExtended}
                  </p>
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {potter.stripe_account_id ? (
                  <BuyNowButton
                    productId={product.id}
                    potterId={potter.id}
                    createCheckoutAction={createBuyNowCheckout}
                  />
                ) : (
                  <a
                    href={buildAddToCartUrl(product, potter)}
                    className="foxycart inline-flex items-center justify-center rounded-lg bg-clay-600 px-6 py-3 text-base font-medium text-white hover:bg-clay-700 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:ring-offset-2"
                    rel="nofollow"
                  >
                    Add to cart
                  </a>
                )}
                <Link
                  href={`/${potter.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-clay-300 bg-white px-6 py-3 text-base font-medium text-clay-700 hover:bg-clay-50"
                >
                  ← More from {potter.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
