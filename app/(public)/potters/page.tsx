import Link from "next/link";
import Image from "next/image";
import { getAllPotters, getGalleryPieces } from "@/lib/data/potters";
import { getPublicImageUrl } from "@/lib/utils/images";
import { Vessel } from "@/components/brand/Vessel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Potters | Ceramics Gallery",
  description: "Meet the independent British potters selling on Ceramics Gallery.",
};

export default async function PottersPage() {
  const [potters, pieces] = await Promise.all([getAllPotters(), getGalleryPieces(500)]);

  const byPotter = new Map<string, { covers: string[]; count: number }>();
  for (const p of pieces) {
    const e = byPotter.get(p.potter_slug) ?? { covers: [], count: 0 };
    e.count++;
    if (p.cover_path && e.covers.length < 3) e.covers.push(p.cover_path);
    byPotter.set(p.potter_slug, e);
  }

  // Potters with work for sale first, then alphabetical.
  const sorted = [...potters].sort(
    (a, b) =>
      (byPotter.get(b.slug)?.count ?? 0 ? 1 : 0) - (byPotter.get(a.slug)?.count ?? 0 ? 1 : 0) ||
      (a.studio_name ?? a.display_name).localeCompare(b.studio_name ?? b.display_name),
  );

  return (
    <div className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 border-b border-ink/15 pb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">The potters</p>
            <h1 className="font-display text-6xl sm:text-7xl text-ink leading-none mt-3">
              The hands <em className="text-terracotta font-normal">behind the pots.</em>
            </h1>
          </div>
          <p className="text-ink/60 text-sm">{potters.length} {potters.length === 1 ? "studio" : "studios"}</p>
        </div>

        {sorted.length === 0 ? (
          <p className="text-ink/55">No potters yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {sorted.map((potter, i) => {
              const name = potter.studio_name ?? potter.display_name;
              const info = byPotter.get(potter.slug) ?? { covers: [], count: 0 };
              return (
                <Link key={potter.id} href={`/${potter.slug}`} className="group block">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((n) => {
                      const cover = info.covers[n];
                      const tall = n === 0;
                      return (
                        <div
                          key={n}
                          className={`relative overflow-hidden rounded-t-[999px] rounded-b-xl ${
                            tall ? "col-span-2 row-span-2" : "aspect-square"
                          } ${["bg-clay-200", "bg-celadon-light", "bg-terracotta-light/60"][(i + n) % 3]}`}
                        >
                          {cover ? (
                            <Image
                              src={getPublicImageUrl(cover)}
                              alt=""
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 60vw, 20vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-end justify-center pb-[12%]">
                              <Vessel variant={i + n} className="w-1/2 text-ink/25" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <p className="kicker text-ink/50">{potter.location_label ?? "British potter"}</p>
                    <h2 className="font-display text-3xl text-ink leading-tight mt-1 group-hover:text-terracotta transition-colors">
                      {name}
                    </h2>
                    {potter.studio_name && <p className="text-sm text-ink/55">by {potter.display_name}</p>}
                    {potter.headline && <p className="text-ink/70 mt-2 leading-snug line-clamp-2">{potter.headline}</p>}
                    <p className="text-sm font-semibold text-ink mt-3">
                      {info.count > 0 ? `${info.count} ${info.count === 1 ? "piece" : "pieces"} for sale →` : "Visit the studio →"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
