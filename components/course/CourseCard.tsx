import Link from "next/link";
import Image from "next/image";
import type { PublicCourse } from "@/lib/data/courses";
import { FORMATS, LEVELS, fmtDay, fmtDuration, fmtPrice, label } from "@/lib/courses/meta";
import { getPublicImageUrl } from "@/lib/utils/images";
import { Vessel } from "@/components/brand/Vessel";

export function CourseCard({ course, showPotter = true }: { course: PublicCourse; showPotter?: boolean }) {
  const cover = course.image_paths[0];
  const next = course.sessions.slice(0, 3);
  const studio = course.potter.studio_name ?? course.potter.display_name;
  const where = course.is_online ? "Online" : course.potter.location_label;

  return (
    <Link href={`/courses/${course.slug}`} className="group grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] gap-4 sm:gap-6 rounded-3xl border border-ink/10 bg-paper p-3 sm:p-4 hover:border-ink/35 transition-colors">
      <div className="relative aspect-[4/5] rounded-t-[999px] rounded-b-2xl overflow-hidden bg-celadon-light">
        {cover ? (
          <Image src={getPublicImageUrl(cover)} alt="" fill sizes="(min-width: 640px) 180px, 110px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-end justify-center pb-[12%]">
            <Vessel variant={course.title.length} fill="#5f7a5c" className="w-1/2" />
          </div>
        )}
      </div>
      <div className="min-w-0 py-1 flex flex-col">
        <p className="kicker text-ink/65">
          {label(FORMATS, course.format)}{where ? ` · ${where}` : ""}
        </p>
        <h3 className="font-display text-2xl sm:text-3xl text-ink leading-tight mt-1 group-hover:text-terracotta transition-colors">{course.title}</h3>
        {showPotter && <p className="text-sm text-ink/65">with {studio}</p>}
        {course.summary && <p className="text-ink/70 text-sm sm:text-base mt-2 line-clamp-2">{course.summary}</p>}

        <div className="mt-auto pt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="text-sm text-ink/70">
            {course.booking_mode === "dates" && next.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {next.map((s) => (
                  <span key={s.id} className={`rounded-full border px-2.5 py-0.5 ${s.places_left === 0 ? "border-ink/10 text-ink/35 line-through" : "border-ink/20"}`}>
                    {fmtDay(s.starts_at)}{s.meetings.length > 1 ? ` (${s.meetings.length} wks)` : ""}
                  </span>
                ))}
                {course.sessions.length > 3 && <span className="text-ink/65 py-0.5">+{course.sessions.length - 3} more</span>}
              </div>
            )}
            {course.booking_mode === "on_request" && <span>Dates to suit you</span>}
            {course.booking_mode === "ongoing" && <span>Weekly classes · join any time</span>}
            <span className="block text-ink/65 mt-1">
              {[label(LEVELS, course.level), fmtDuration(course.duration_minutes)].filter(Boolean).join(" · ")}
            </span>
          </div>
          <p className="font-display text-2xl text-ink leading-none">
            {fmtPrice(course.price_pence)}
            <span className="text-sm font-body text-ink/65">{course.booking_mode === "ongoing" ? ` / ${course.sessions_count ?? ""} sessions` : " pp"}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
