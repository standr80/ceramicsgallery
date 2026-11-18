import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentPotter } from "@/lib/get-potter";
import { getMyCourse, getMyRequests } from "@/lib/data/courses";
import { setCoursePublished, duplicateCourse, deleteCourse, cancelSession } from "@/app/actions/courses";
import { CourseForm } from "@/components/course/CourseForm";
import { AddDatesForm } from "@/components/course/AddDatesForm";
import { RequestCard } from "@/components/course/RequestCard";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { HOLD_HOURS, fmtDay, fmtDayLong, fmtTimeRange } from "@/lib/courses/meta";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function EditCoursePage({ params, searchParams }: Props) {
  const [{ courseId }, { saved, error }, potter] = await Promise.all([params, searchParams, getCurrentPotter()]);
  if (!potter) redirect("/login");
  const data = await getMyCourse(potter.id, courseId);
  if (!data) notFound();
  const { course, sessions } = data;
  const requests = await getMyRequests(potter.id, course.id);
  const open = requests.filter((r) => r.status === "pending");
  const upcoming = sessions.filter((s) => new Date(s.ends_at).getTime() > Date.now() && !s.is_cancelled);
  const holdFrom = Date.now() - HOLD_HOURS * 3600_000;

  async function remove() {
    "use server";
    const res = await deleteCourse(course.id);
    if (res?.error) redirect(`/dashboard/courses/${course.id}?error=bookings`);
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link href="/dashboard/courses" className="text-sm text-ink/65 hover:text-ink">← Courses</Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
          <div>
            <h1 className="font-display text-4xl text-ink">{course.title}</h1>
            <p className="mt-1 text-sm">
              <span className={`font-semibold rounded-full px-2.5 py-1 text-xs ${course.is_published ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"}`}>
                {course.is_published ? "Published" : "Draft"}
              </span>
              {course.is_published && !potter.is_published && (
                <span className="ml-3 text-amber-700">Not visible yet: your potter page is unpublished. <Link href="/dashboard/profile" className="underline">Publish it</Link></span>
              )}
              {course.is_published && potter.is_published && (
                <Link href={`/courses/${course.id}`} className="ml-3 text-terracotta-dark hover:underline">View public page →</Link>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={setCoursePublished.bind(null, course.id, !course.is_published)}>
              <button className={course.is_published ? "btn-secondary" : "btn-primary"}>{course.is_published ? "Unpublish" : "Publish"}</button>
            </form>
            <form action={duplicateCourse.bind(null, course.id)}>
              <button className="btn-ghost">Duplicate</button>
            </form>
            <form action={remove}>
              <ConfirmButton className="btn-ghost text-red-700" message={`Delete "${course.title}"? This can't be undone.`}>Delete</ConfirmButton>
            </form>
          </div>
        </div>
        {error === "bookings" && <p role="alert" className="mt-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">This course has open bookings, so it can&apos;t be deleted. Cancel its dates first, or unpublish it instead.</p>}
        {saved && <p className="mt-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">Saved.{!course.is_published && " Publish it when you're ready for people to see it."}</p>}
      </div>

      {open.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl text-ink">Waiting for your answer</h2>
          {open.map((r) => (
            <RequestCard key={r.id} r={{
              ...r,
              when: r.session ? (r.session.meetings?.length ? r.session.meetings : [{ starts_at: r.session.starts_at, ends_at: r.session.starts_at }])
                .map((m) => fmtDay(m.starts_at)).join(", ") : undefined,
              expired: new Date(r.created_at).getTime() < holdFrom,
            }} />
          ))}
        </section>
      )}

      {course.booking_mode === "dates" && (
        <section className="flex flex-col gap-4">
          <h2 className="flex items-baseline gap-3 border-b border-ink/15 pb-3">
            <span className="font-display text-2xl text-ink">Dates</span>
            <span className="text-sm text-ink/65">{upcoming.length} upcoming</span>
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink/60">No upcoming dates. Add one below{!course.is_published ? ", then publish the course" : ""}.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-ink/10 rounded-2xl border border-ink/12 bg-white">
              {upcoming.map((s) => {
                const taken = s.confirmed + s.places_booked;
                return (
                  <li key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink">
                        {fmtDayLong(s.meetings[0].starts_at)}, {fmtTimeRange(s.meetings[0])}
                      </p>
                      {s.meetings.length > 1 && (
                        <p className="text-sm text-ink/65">
                          {s.meetings.length} weeks: {s.meetings.map((m) => fmtDay(m.starts_at)).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <span className="tabular-nums">
                        <strong>{taken}</strong>/{s.places_total} confirmed
                        {s.requested > 0 && <span className="text-amber-700"> · {s.requested} held</span>}
                      </span>
                      <form action={cancelSession.bind(null, s.id, course.id)}>
                        <ConfirmButton
                          className="text-ink/65 underline underline-offset-2 hover:text-red-700"
                          message={taken + s.requested > 0
                            ? `Cancel this date? The ${taken + s.requested} people booked will be emailed that it's cancelled.`
                            : "Remove this date?"}
                        >
                          {taken + s.requested > 0 ? "Cancel date" : "Remove"}
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <AddDatesForm
            courseId={course.id}
            defaultPlaces={course.max_places}
            multiWeek={course.format === "weekly"}
            defaultHours={course.duration_minutes ? course.duration_minutes / 60 : null}
          />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-ink border-b border-ink/15 pb-3">Details</h2>
        <CourseForm course={course} studioAddress={potter.studio_address} />
      </section>
    </div>
  );
}
