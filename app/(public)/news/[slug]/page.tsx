import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPost, fmtPostDate } from "@/lib/blog";

export const revalidate = 300;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const description = post.meta_description ?? post.excerpt ?? "";
  return {
    title: `${post.title} | Ceramics Gallery`,
    description,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.published_at,
      images: post.hero_image ? [post.hero_image] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    image: post.hero_image ?? undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    publisher: { "@type": "Organization", name: "Ceramics Gallery" },
  };

  return (
    <article className="py-10 sm:py-14 px-4 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-3xl">
        <nav className="text-sm text-ink/65 mb-6">
          <Link href="/news" className="hover:text-ink">← News</Link>
        </nav>
        <p className="kicker">{fmtPostDate(post.published_at)}{post.author ? ` · ${post.author}` : ""}</p>
        <h1 className="font-display text-5xl sm:text-6xl text-ink leading-[1.02] mt-3">{post.title}</h1>
        {post.excerpt && <p className="font-display italic text-2xl text-terracotta mt-5">{post.excerpt}</p>}
      </div>

      {post.hero_image && (
        <figure className="mx-auto max-w-5xl mt-10">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-celadon-light">
            <Image src={post.hero_image} alt={post.hero_image_alt ?? ""} fill unoptimized priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </div>
          {post.hero_image_credit && <figcaption className="text-xs text-ink/65 mt-2 text-right">{post.hero_image_credit}</figcaption>}
        </figure>
      )}

      <div className="mx-auto max-w-3xl mt-10">
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.body_html }} />

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-ink/10">
            {post.tags.map((t) => (
              <Link key={t} href={`/news?tag=${encodeURIComponent(t)}`} className="rounded-full border border-ink/20 px-3 py-1 text-sm text-ink/70 hover:border-ink">{t}</Link>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-3xl bg-celadon-light/60 p-6 sm:p-8 grid sm:grid-cols-2 gap-4 items-center">
          <p className="font-display text-2xl text-ink">Find something made by hand.</p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href="/shop" className="btn-primary">Browse the shop</Link>
            <Link href="/courses" className="btn-secondary">Find a class</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
