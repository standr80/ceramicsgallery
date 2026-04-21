import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPotterBySlug, getAllSlugs, getCoursesByPotterId } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { PotterCourseCard } from "@/components/PotterCourseCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const potter = await getPotterBySlug(slug);
  if (!potter) return { title: "Potter not found" };
  const description = (potter.biography ?? "").slice(0, 160);
  return {
    title: `${potter.name} | Ceramics Gallery`,
    description: description || "Potter on Ceramics Gallery",
    openGraph: {
      title: `${potter.name} | Ceramics Gallery`,
      description: description || "Potter on Ceramics Gallery",
    },
  };
}

export default async function PotterPage({ params }: PageProps) {
  const { slug } = await params;
  const potter = await getPotterBySlug(slug);
  if (!potter) notFound();

  const courses = await getCoursesByPotterId(potter.id);

  return (
    <div>
      {/* Potter header */}
      <section className="bg-gradient-to-b from-clay-100 to-clay-50 py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/#potters"
            className="text-clay-600 hover:text-clay-700 text-sm font-medium mb-4 inline-block"
          >
            ← All potters
          </Link>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-72 shrink-0 aspect-square relative rounded-xl overflow-hidden bg-stone-100 border border-clay-200/60">
              <Image
                src={potter.image ?? "/images/placeholder.svg"}
                alt={potter.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
                priority
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-clay-900">
                {potter.name}
              </h1>
              <div className="mt-4 prose prose-stone max-w-none">
                <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                  {potter.biography}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product catalogue */}
      {(potter.products ?? []).length > 0 && (
        <section className="py-14 px-4" aria-labelledby="catalogue-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="catalogue-heading" className="font-display text-2xl font-semibold text-clay-900 mb-8">
              Catalogue
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(potter.products ?? []).map((product) => (
                <ProductCard key={product.id} product={product} potter={potter} />
              ))}
            </div>
            <p className="mt-6 text-sm text-stone-500">
              Secure checkout is powered by Stripe.
            </p>
          </div>
        </section>
      )}

      {/* Courses */}
      {courses.length > 0 && (
        <section className="py-14 px-4 bg-stone-50/60" aria-labelledby="courses-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="courses-heading" className="font-display text-2xl font-semibold text-clay-900 mb-2">
              Courses &amp; workshops
            </h2>
            <p className="text-stone-500 text-sm mb-8">
              Taught by {potter.name}. Contact the potter directly to book.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <PotterCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
