import Link from "next/link";
import Image from "next/image";
import { getGalleryPieces, getAllPotters } from "@/lib/data/potters";
import { PieceCard } from "@/components/piece/PieceCard";
import { Vessel } from "@/components/brand/Vessel";
import { getPublicImageUrl } from "@/lib/utils/images";
import { JsonLd, SITE } from "@/components/seo/JsonLd";

export const metadata = {
  title: "Ceramics Gallery | Handmade Pottery, Potters & Pottery Classes in the UK",
  description: "Buy handmade pottery direct from independent British potters, meet the makers, and find pottery classes and workshops in their studios.",
  alternates: { canonical: "/" },
};

const siteLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE}/#org`, name: "Ceramics Gallery", url: SITE, logo: `${SITE}/opengraph-image` },
    { "@type": "WebSite", "@id": `${SITE}/#site`, name: "Ceramics Gallery", url: SITE, inLanguage: "en-GB", publisher: { "@id": `${SITE}/#org` } },
  ],
};

export const dynamic = "force-dynamic";

const MAKES = ["Stoneware", "Porcelain", "Raku", "Earthenware", "Pit-fired", "Slipware", "Salt-glazed", "Wood-fired", "Tableware", "Vases", "Sculpture"];

export default async function HomePage() {
  const [pieces, potters] = await Promise.all([getGalleryPieces(8), getAllPotters()]);
  const heroImages = pieces.filter((p) => p.cover_path).slice(0, 3);

  return (
    <div>
      <JsonLd data={siteLd} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
          <div>
            <p className="kicker">Handmade in Britain · Direct from the studio</p>
            <h1 className="font-display text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[5.5rem] font-semibold text-ink mt-5 tracking-tight">
              Pots with a <em className="text-terracotta font-normal">maker</em> behind them.
            </h1>
            <p className="mt-6 text-lg text-ink/70 max-w-md leading-relaxed">
              Buy one-off ceramics straight from independent British potters. Every piece is thrown, fired and glazed by hand by the person you&apos;re buying from.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary text-base px-7 py-3.5">Browse the pots</Link>
              <Link href="/signup" className="btn-secondary text-base px-7 py-3.5">I&apos;m a potter</Link>
            </div>
          </div>

          <HeroCollage images={heroImages.map((p) => ({ src: getPublicImageUrl(p.cover_path!), alt: p.title }))} />
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-ink text-paper py-4 overflow-hidden border-y border-ink" aria-hidden="true">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0">
              {MAKES.map((m) => (
                <span key={m} className="font-display italic text-2xl px-6 flex items-center gap-6">
                  {m}<span className="text-terracotta not-italic text-base">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Latest pieces */}
      {pieces.length > 0 && (
        <section className="py-20 sm:py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHead index="01" title="Fresh from the kiln" link={{ href: "/shop", label: "See every pot" }} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
              {pieces.map((piece) => (
                <PieceCard key={piece.id} piece={piece} showPotter />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why */}
      <section className="px-4 sm:px-6 pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-px bg-ink/10 rounded-3xl overflow-hidden border border-ink/10">
          {[
            { n: "i.", t: "One of one", d: "No factory runs. Each pot is made by hand, so the one you see is the one you get." },
            { n: "ii.", t: "Talk to the maker", d: "Ask about glazes, commissions or collection. Your message goes straight to the potter." },
            { n: "iii.", t: "Fair to the studio", d: "Potters keep the lion's share of every sale. No middlemen, no warehouse." },
          ].map((f) => (
            <div key={f.t} className="bg-paper p-8 sm:p-10">
              <p className="font-display italic text-terracotta text-2xl">{f.n}</p>
              <h3 className="font-display text-3xl text-ink mt-3">{f.t}</h3>
              <p className="text-ink/65 mt-3 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Potters */}
      {potters.length > 0 && (
        <section className="py-20 sm:py-24 px-4 sm:px-6 bg-celadon-light/50 border-y border-ink/10">
          <div className="mx-auto max-w-6xl">
            <SectionHead index="02" title="Meet the potters" link={{ href: "/potters", label: "All potters" }} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {potters.map((potter, i) => {
                const name = potter.studio_name ?? potter.display_name;
                return (
                  <Link
                    key={potter.id}
                    href={`/${potter.slug}`}
                    className="group flex items-center gap-4 bg-paper rounded-2xl p-4 border border-ink/10 hover:border-ink/40 transition-colors"
                  >
                    <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-clay-200 flex items-center justify-center">
                      {potter.avatar_path ? (
                        <Image src={getPublicImageUrl(potter.avatar_path)} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <Vessel variant={i} className="w-8 text-clay-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-2xl text-ink leading-tight group-hover:text-terracotta transition-colors line-clamp-1">{name}</p>
                      <p className="text-sm text-ink/65 line-clamp-1">
                        {potter.studio_name ? potter.display_name : null}
                        {potter.studio_name && potter.location_label ? " · " : null}
                        {potter.location_label}
                      </p>
                    </div>
                    <span className="ml-auto text-ink/30 group-hover:text-terracotta group-hover:translate-x-1 transition-all">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Potter CTA */}
      <section className="px-4 sm:px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl relative overflow-hidden rounded-[2rem] bg-tenmoku text-paper px-8 py-14 sm:px-14 sm:py-20">
          <Vessel variant={1} fill="#c0532d" className="absolute -right-6 -bottom-10 w-56 sm:w-72 opacity-90" />
          <Vessel variant={0} fill="#8ea98a" className="absolute right-40 sm:right-64 -bottom-16 w-32 sm:w-44 opacity-80 hidden sm:block" />
          <div className="relative max-w-lg">
            <p className="kicker text-terracotta-light">For potters</p>
            <h2 className="font-display text-5xl sm:text-6xl leading-[0.95] mt-4">Your work deserves better than a craft fair table.</h2>
            <p className="mt-5 text-paper/75 text-lg leading-relaxed">
              Snap a pot on your phone, we&apos;ll write the listing. Get your own page, take enquiries or payments, and reach buyers right across the UK.
            </p>
            <Link href="/signup" className="mt-8 inline-flex items-center justify-center rounded-xl bg-paper text-ink px-7 py-3.5 font-semibold hover:bg-terracotta hover:text-paper transition-colors">
              Start selling, it&apos;s free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ index, title, link }: { index: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-10 border-b border-ink/15 pb-5">
      <div className="flex items-baseline gap-4">
        <span className="font-display italic text-terracotta text-xl">{index}</span>
        <h2 className="font-display text-4xl sm:text-5xl text-ink leading-none">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="text-sm font-semibold text-ink hover:text-terracotta whitespace-nowrap underline underline-offset-4 decoration-ink/20 hover:decoration-terracotta">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

function HeroCollage({ images }: { images: { src: string; alt: string }[] }) {
  // Three arched frames; real photos where we have them, glazed vessel tiles otherwise.
  const frames = [
    { cls: "col-start-1 row-start-1 row-span-2 h-[320px] sm:h-[400px]", bg: "bg-terracotta-light/70", fg: "#9c3f1f", v: 0 },
    { cls: "col-start-2 row-start-1 h-[190px] sm:h-[230px] mt-10", bg: "bg-celadon-light", fg: "#5f7a5c", v: 1 },
    { cls: "col-start-2 row-start-2 h-[150px] sm:h-[180px]", bg: "bg-clay-200", fg: "#4a2c1d", v: 2 },
  ];
  return (
    <div className="relative grid grid-cols-2 gap-4 items-start max-w-md mx-auto lg:ml-auto w-full">
      {frames.map((f, i) => {
        const img = images[i];
        return (
          <div key={i} className={`${f.cls} relative overflow-hidden rounded-t-[999px] rounded-b-3xl ${f.bg}`}>
            {img ? (
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" unoptimized priority={i === 0} />
            ) : (
              <div className="absolute inset-0 flex items-end justify-center pb-[10%]">
                <Vessel variant={f.v} fill={f.fg} className="w-3/5" />
              </div>
            )}
          </div>
        );
      })}
      <div className="absolute -left-4 bottom-6 sm:-left-8 bg-paper border border-ink/15 rounded-full px-4 py-2 shadow-sm text-sm">
        <span className="font-display italic text-lg text-terracotta">{images.length ? "Just listed" : "Made by hand"}</span>
      </div>
    </div>
  );
}
