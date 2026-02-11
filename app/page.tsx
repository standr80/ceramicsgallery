import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts, getAllPotters } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const [featured, potters] = await Promise.all([
    getFeaturedProducts(),
    getAllPotters(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-clay-100 to-clay-50 py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-clay-900">
            Ceramics Gallery
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            Handmade pottery from British ceramacists. Discover unique pieces from
            our community of potters.
          </p>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-14 px-4" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="featured-heading" className="font-display text-2xl font-semibold text-clay-900 mb-8">
            Featured products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map(({ product, potter }) => (
              <ProductCard
                key={product.id}
                product={product}
                potter={potter}
                showPotter
              />
            ))}
          </div>
        </div>
      </section>

      {/* Potters */}
      <section id="potters" className="py-14 px-4 bg-stone-100/50" aria-labelledby="potters-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="potters-heading" className="font-display text-2xl font-semibold text-clay-900 mb-8">
            Our potters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {potters.map((potter) => (
              <Link
                key={potter.id}
                href={`/${potter.slug}`}
                className="group block rounded-xl overflow-hidden bg-white border border-clay-200/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square relative bg-stone-100 overflow-hidden">
                  <Image
                    src={potter.image ?? "/images/placeholder.svg"}
                    alt={potter.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl font-semibold text-stone-900 group-hover:text-clay-600 transition-colors">
                    {potter.name}
                  </h3>
                  <p className="text-stone-600 text-sm line-clamp-2 mt-1">
                    {potter.biography}
                  </p>
                  <span className="inline-block mt-2 text-clay-600 font-medium text-sm">
                    View work →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-clay-900">
            Are you a potter?
          </h2>
          <p className="mt-2 text-stone-600">
            Join Ceramics Gallery and showcase your work to buyers across the UK.
          </p>
          <Link href="/signup" className="btn-primary mt-6 inline-block">
            Sign up as a potter
          </Link>
        </div>
      </section>
    </div>
  );
}
