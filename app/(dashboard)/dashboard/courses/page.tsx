import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPotter } from "@/lib/get-potter";
import { getMyCourses } from "@/lib/data/courses";
import { setCoursePublished } from "@/app/actions/courses";
import { BOOKING_MODES, FORMATS, fmtDay, fmtPrice, label } from "@/lib/courses/meta";
import { getPublicImageUrl } from "@/lib/utils/images";

export const dynamic = "force-dynamic";

export default async function DashboardCoursesPage() {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");
  const courses = await getMyCourses(potter.id);
  const pending = courses.reduce((n, c) => n + c.pending_requests, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Courses</h1>
          <p className="text-ink/60 mt-1">List your classes and workshops. People request a place and you confirm it.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/courses/requests" className="btn-secondary relative">
            Requests
            {pending > 0 && <span className="ml-2 rounded-full bg-terracotta text-paper text-xs px-2 py-0.5">{pending}</span>}
          </Link>
          <Link href="/dashboard/courses/new" className="btn-primary">Add a course</Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/20 p-10 text-center">
          <p className="font-display text-3xl text-ink">No courses yet</p>
          <p className="text-ink/60 mt-2 max-w-md mx-auto">Tasters, weekend courses, 1:1 lessons, weekly classes… add one and it&apos;ll appear on your page and in the courses directory.</p>
          <Link href="/dashboard/courses/new" className="btn-primary mt-6 inline-flex">Add your first course</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {courses.map((c) => {
            const next = c.sessions[0];
            const booked = c.sessions.reduce((n, s) => n + s.confirmed + s.requested + s.places_booked, 0);
            const total = c.sessions.reduce((n, s) => n + s.places_total, 0);
            return (
              <li key={c.id} className="rounded-2xl border border-ink/12 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <Link href={`/dashboard/courses/${c.id}`} className="flex items-center gap-4 min-w-0 flex-1 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-clay-100 shrink-0">
                    {c.image_paths[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getPublicImageUrl(c.image_paths[0])} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink group-hover:text-terracotta line-clamp-1">{c.title}</p>
                    <p className="text-sm text-ink/65">
                      {label(FORMATS, c.format)} · {fmtPrice(c.price_pence)} · {label(BOOKING_MODES, c.booking_mode)}
                    </p>
                    <p className="text-sm text-ink/65">
                      {c.booking_mode === "dates"
                        ? next ? `Next: ${fmtDay(next.starts_at)} · ${booked}/${total} places taken across ${c.sessions.length} date${c.sessions.length > 1 ? "s" : ""}` : "No upcoming dates. Add some to show it in the directory."
                        : c.external_booking_url ? "Booked on your own website" : "Taking requests"}
                      {c.pending_requests > 0 && <span className="text-terracotta font-semibold"> · {c.pending_requests} to answer</span>}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${c.is_published ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"}`}>
                    {c.is_published ? "Published" : "Draft"}
                  </span>
                  <form action={setCoursePublished.bind(null, c.id, !c.is_published)}>
                    <button className="text-sm underline underline-offset-2 text-ink/60 hover:text-ink">{c.is_published ? "Unpublish" : "Publish"}</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
