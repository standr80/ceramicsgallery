import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedCourse } from "@/lib/data/courses";
import { RequestForm } from "@/components/course/RequestForm";
import { DemoNotice } from "@/components/potter/DemoNotice";
import { PieceGallery } from "@/components/piece/PieceGallery";
import { Vessel } from "@/components/brand/Vessel";
import { getPublicImageUrl } from "@/lib/utils/images";
import { JsonLd, SITE } from "@/components/seo/JsonLd";
import {
  FORMATS, LEVELS, TECHNIQUES, INCLUDED, cancellationText, fmtDay, fmtDayLong, fmtDuration, fmtPrice, fmtTimeRange, label,
} from "@/lib/courses/meta";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ courseId: string }> }

export async function generateMetadata({ params }: Props) {
  const course = await getPublishedCourse((await params).courseId);
  if (!course) return {};
  const studio = course.potter.studio_name ?? course.potter.display_name;
  return {
    title: `${course.title} with ${studio} | Ceramics Gallery`,
    description: course.summary ?? course.description?.slice(0, 160) ?? "",
    alternates: { canonical: `/courses/${course.slug}` },
    ...(course.image_paths.length > 0 && { openGraph: { images: [getPublicImageUrl(course.image_paths[0])] } }),
    robots: course.potter.is_demo ? { index: false } : undefined,
  };
}

export default async function CoursePage({ params }: Props) {
  const { courseId } = await params;
  const course = await getPublishedCourse(courseId);
  if (!course) notFound();
  if (courseId !== course.slug) permanentRedirect(`/courses/${course.slug}`);
  const p = course.potter;
  const studio = p.studio_name ?? p.display_name;
  const venue = course.is_online ? "Online" : [course.venue_name ?? studio, course.venue_address ?? p.studio_address].filter(Boolean).join("\n");

  const facts: [string, string][] = [
    ["Format", label(FORMATS, course.format)],
    ["Level", label(LEVELS, course.level)],
    ["Length", fmtDuration(course.duration_minutes) + (course.booking_mode === "ongoing" && course.duration_minutes ? " per class" : "")],
    ["Class size", course.max_places ? `Up to ${course.max_places}` : ""],
    ["Minimum age", course.min_age ? `${course.min_age}+` : ""],
    ["Experience", course.prerequisites ?? ""],
  ].filter(([, v]) => v) as [string, string][];

  const included = INCLUDED.filter((i) => course.included.includes(i.value)).map((i) =>
    i.value === "firing" && course.pieces_fired ? `Firing of ${course.pieces_fired} piece${course.pieces_fired > 1 ? "s" : ""}` : i.label);

  const offer = {
    "@type": "Offer",
    price: (course.price_pence / 100).toFixed(2),
    priceCurrency: "GBP",
    category: "Paid",
  };
  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary ?? course.description ?? course.title,
    url: `${SITE}/courses/${course.slug}`,
    image: course.image_paths.map(getPublicImageUrl),
    provider: { "@type": "Organization", name: studio, sameAs: `${SITE}/${p.slug}` },
    offers: [offer],
    hasCourseInstance: course.booking_mode === "dates" && course.sessions.length
      ? course.sessions.map((s) => ({
          "@type": "CourseInstance",
          courseMode: course.is_online ? "Online" : "Onsite",
          startDate: s.starts_at,
          endDate: s.meetings[s.meetings.length - 1]?.ends_at ?? s.ends_at,
          location: course.is_online ? undefined : { "@type": "Place", name: course.venue_name ?? studio, address: course.venue_address ?? p.studio_address ?? p.location_label ?? undefined },
          offers: offer,
        }))
      : [{ "@type": "CourseInstance", courseMode: course.is_online ? "Online" : "Onsite", courseSchedule: course.schedule_text ? { "@type": "Schedule", repeatFrequency: "P1W", description: course.schedule_text } : undefined }],
  };

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6">
      {!p.is_demo && <JsonLd data={courseLd} />}
      <div className="mx-auto max-w-6xl">
        <nav className="text-sm text-ink/65 mb-6">
          <Link href="/courses" className="hover:text-ink">Courses</Link> / <Link href={`/${p.slug}`} className="hover:text-ink">{studio}</Link>
        </nav>

        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-14">
          <div className="flex flex-col gap-10 min-w-0">
            <header>
              <p className="kicker">{label(FORMATS, course.format)}{p.location_label ? ` · ${p.location_label}` : ""}</p>
              <h1 className="font-display text-5xl sm:text-6xl text-ink leading-[0.95] mt-3">{course.title}</h1>
              <p className="text-ink/60 mt-3">with <Link href={`/${p.slug}`} className="text-ink underline underline-offset-4 decoration-ink/25 hover:decoration-terracotta">{studio}</Link></p>
              {course.summary && <p className="font-display italic text-2xl text-terracotta mt-5">{course.summary}</p>}
            </header>

            {course.image_paths.length > 0 ? (
              <PieceGallery urls={course.image_paths.map(getPublicImageUrl)} title={course.title} />
            ) : (
              <div className="aspect-[16/9] rounded-3xl bg-celadon-light flex items-end justify-center pb-8">
                <Vessel variant={1} fill="#5f7a5c" className="w-24" />
              </div>
            )}

            {course.description && (
              <section>
                <p className="text-ink/80 text-lg leading-relaxed whitespace-pre-line">{course.description}</p>
                {course.what_youll_make && (
                  <p className="mt-5 text-ink/80"><strong className="text-ink">You&apos;ll make:</strong> {course.what_youll_make}</p>
                )}
              </section>
            )}

            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-ink/10 rounded-2xl overflow-hidden border border-ink/10">
              {facts.map(([k, v]) => (
                <div key={k} className="bg-paper p-4">
                  <dt className="kicker text-ink/65">{k}</dt>
                  <dd className="text-ink mt-1">{v}</dd>
                </div>
              ))}
            </dl>

            {(included.length > 0 || course.extras || course.collection_info) && (
              <section>
                <h2 className="font-display text-3xl text-ink mb-4">What&apos;s included</h2>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {included.map((i) => (
                    <li key={i} className="flex gap-2 text-ink/80"><span className="text-celadon-dark">✓</span>{i}</li>
                  ))}
                </ul>
                {course.extras && <p className="text-sm text-ink/60 mt-4"><strong>Extras:</strong> {course.extras}</p>}
                {course.collection_info && <p className="text-sm text-ink/60 mt-1"><strong>Your work:</strong> {course.collection_info}</p>}
              </section>
            )}

            {course.techniques.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.techniques.map((t) => (
                  <Link key={t} href={`/courses?technique=${t}`} className="rounded-full border border-ink/20 px-3 py-1 text-sm text-ink/70 hover:border-ink">
                    {label(TECHNIQUES, t)}
                  </Link>
                ))}
              </div>
            )}

            <section className="grid sm:grid-cols-2 gap-8 border-t border-ink/10 pt-8">
              <div>
                <p className="kicker text-ink/65 mb-2">Where</p>
                <p className="text-ink/80 whitespace-pre-line">{venue || "Details on booking"}</p>
              </div>
              <div>
                <p className="kicker text-ink/65 mb-2">Cancellations</p>
                <p className="text-ink/80 text-sm">{cancellationText(course.cancellation_policy, course.cancellation_text)}</p>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 self-start flex flex-col gap-5">
            <div>
              <p className="font-display text-5xl text-ink leading-none">
                {fmtPrice(course.price_pence)}
                <span className="text-base font-body text-ink/65">
                  {course.booking_mode === "ongoing" ? ` for ${course.sessions_count ?? ""} sessions` : " per person"}
                </span>
              </p>
              {course.private_price_pence != null && (
                <p className="text-ink/65 mt-2">
                  Private session: {fmtPrice(course.private_price_pence)}{course.private_max_people ? ` for up to ${course.private_max_people}` : ""}
                </p>
              )}
            </div>

            {course.booking_mode === "ongoing" && course.schedule_text && (
              <div className="rounded-2xl border border-ink/15 p-4">
                <p className="kicker text-ink/65 mb-2">Weekly timetable</p>
                <p className="text-ink/80 whitespace-pre-line">{course.schedule_text}</p>
              </div>
            )}

            {p.is_demo ? (
              <DemoNotice />
            ) : course.external_booking_url ? (
              <div className="flex flex-col gap-3">
                {course.booking_mode === "dates" && course.sessions.length > 0 && (
                  <ul className="text-sm text-ink/75 flex flex-col gap-1">
                    {course.sessions.slice(0, 6).map((s) => <li key={s.id}>{fmtDayLong(s.starts_at)}, {fmtTimeRange(s.meetings[0])}</li>)}
                  </ul>
                )}
                <a href={course.external_booking_url} target="_blank" rel="noopener noreferrer" className="btn-primary py-3.5 text-base">
                  Book on {studio}&apos;s website ↗
                </a>
              </div>
            ) : (
              <RequestForm
                courseId={course.id}
                mode={course.booking_mode}
                potterName={studio}
                maxPlaces={course.private_max_people ?? course.max_places}
                sessions={course.sessions.map((s) => ({
                  id: s.id,
                  places_left: s.places_left,
                  label: `${fmtDayLong(s.starts_at)}, ${fmtTimeRange(s.meetings[0])}`,
                  sub: s.meetings.length > 1 ? `${s.meetings.length} weeks: ${s.meetings.map((m) => fmtDay(m.starts_at)).join(" · ")}` : undefined,
                }))}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
