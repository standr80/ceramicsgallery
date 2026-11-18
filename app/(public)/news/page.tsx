import Link from "next/link";
import Image from "next/image";
import { getPosts, fmtPostDate } from "@/lib/blog";
import { Vessel } from "@/components/brand/Vessel";

export const revalidate = 300;

export const metadata = {
  title: "News | Ceramics Gallery",
  description: "Notes on handmade pottery: how it's made, how to buy it, how to live with it, and the potters behind it.",
  alternates: { canonical: "/news" },
};

interface Props { searchParams: Promise<{ page?: string; tag?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const tag = sp.tag?.slice(0, 60);
  const { posts, totalPages } = await getPosts(page, tag);
  const [lead, ...rest] = page === 1 && !tag ? posts : [undefined, ...posts];

  const pageHref = (n: number) => {
    const q = new URLSearchParams();
    if (tag) q.set("tag", tag);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return s ? `/news?${s}` : "/news";
  };

  return (
    <div className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 border-b border-ink/15 pb-8">
          <p className="kicker">News &amp; notes</p>
          <h1 className="font-display text-6xl sm:text-7xl text-ink leading-none mt-3">
            Notes from <em className="text-terracotta font-normal">the studio.</em>
          </h1>
          <p className="text-ink/65 mt-5 max-w-xl text-lg">
            How pots are made, how to choose them, how to look after them, and the people who make them.
          </p>
          {tag && (
            <p className="mt-6 text-sm">
              Showing posts about <strong className="text-ink">{tag}</strong> · <Link href="/news" className="text-terracotta-dark underline underline-offset-2">All posts</Link>
            </p>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/20 p-12 text-center">
            <Vessel variant={2} fill="#b5532f" className="w-16 mx-auto mb-4" />
            <p className="font-display text-3xl text-ink">The first pieces are in the kiln</p>
            <p className="text-ink/60 mt-2">New posts are on their way. In the meantime, <Link href="/shop" className="text-terracotta-dark underline underline-offset-2">browse the shop</Link>.</p>
          </div>
        ) : (
          <>
            {lead && (
              <Link href={`/news/${lead.slug}`} className="group grid md:grid-cols-[1.3fr_1fr] gap-6 md:gap-10 items-center mb-14">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-celadon-light">
                  {lead.hero_image && <Image src={lead.hero_image} alt={lead.hero_image_alt ?? ""} fill priority sizes="(min-width: 768px) 60vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
                </div>
                <div>
                  <p className="kicker text-ink/65">{fmtPostDate(lead.published_at)}</p>
                  <h2 className="font-display text-4xl sm:text-5xl text-ink leading-tight mt-2 group-hover:text-terracotta transition-colors">{lead.title}</h2>
                  {lead.excerpt && <p className="text-ink/70 text-lg mt-4">{lead.excerpt}</p>}
                  <p className="mt-5 text-terracotta font-medium">Read it →</p>
                </div>
              </Link>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {rest.filter(Boolean).map((p) => p && (
                <Link key={p.id} href={`/news/${p.slug}`} className="group flex flex-col">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-celadon-light">
                    {p.hero_image && <Image src={p.hero_image} alt={p.hero_image_alt ?? ""} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </div>
                  <p className="kicker text-ink/65 mt-4">{fmtPostDate(p.published_at)}</p>
                  <h3 className="font-display text-2xl text-ink leading-tight mt-1 group-hover:text-terracotta transition-colors">{p.title}</h3>
                  {p.excerpt && <p className="text-ink/65 mt-2 line-clamp-3">{p.excerpt}</p>}
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="flex justify-center gap-2 mt-14 text-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={pageHref(n)}
                    className={`w-10 h-10 grid place-items-center rounded-full border ${n === page ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/70 hover:border-ink"}`}>
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
