import type { Course } from "@/types";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(price);
}

export function PotterCourseCard({ course }: { course: Course }) {
  return (
    <div className="rounded-xl border border-clay-200/60 bg-white p-5 shadow-sm flex flex-col gap-3">
      {/* Title + price */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-stone-900 leading-snug">
          {course.title}
        </h3>
        <p className="text-lg font-semibold text-clay-700 shrink-0">
          {formatPrice(course.price, course.currency)}
        </p>
      </div>

      {/* Description */}
      <p className="text-stone-600 text-sm leading-relaxed">{course.description}</p>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-2 text-xs text-stone-500 mt-auto">
        {course.type && <span>{course.type}</span>}
        {course.duration && (
          <>
            {course.type && <span>·</span>}
            <span>{course.duration}</span>
          </>
        )}
        {course.skillLevel && (
          <>
            <span>·</span>
            <span className="capitalize">{course.skillLevel}</span>
          </>
        )}
        {course.location && (
          <>
            <span>·</span>
            <span>{course.location}</span>
          </>
        )}
        <span>·</span>
        {course.startDate ? (
          <time dateTime={course.startDate}>
            {new Date(course.startDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        ) : (
          <span className="italic">Date TBC</span>
        )}
        {course.url && (
          <>
            <span>·</span>
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-clay-600 hover:text-clay-700 hover:underline"
            >
              Book / more info →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
