import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";
import { CourseDeleteButton } from "@/components/CourseDeleteButton";

export const dynamic = "force-dynamic";

export default async function CoursesListPage() {
  const potter = await getCurrentPotter();
  if (!potter) return null;

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, type, price, currency, start_date, active, source")
    .eq("potter_id", potter.id)
    .eq("active", true)
    .order("start_date", { ascending: true, nullsFirst: false });

  const list = courses ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-xl font-semibold text-clay-900">
          Your courses
        </h2>
        <Link href="/dashboard/courses/new" className="btn-primary text-sm">
          + Add course
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 py-16 text-center text-stone-400">
          <p className="font-medium">No courses yet.</p>
          <p className="text-sm mt-1">
            Add one manually or run the Agents scout to import from your website.
          </p>
          <Link href="/dashboard/courses/new" className="btn-primary mt-4 inline-block text-sm">
            + Add course
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => {
            const dateLabel = c.start_date
              ? new Date(c.start_date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : "Date TBC";

            return (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-clay-200/60 bg-white p-4 gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{c.title}</p>
                  <p className="text-sm text-stone-500">
                    {c.type && <span>{c.type} · </span>}
                    {c.currency} {Number(c.price).toFixed(2)} · {dateLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/dashboard/courses/${c.id}`}
                    className="text-sm font-medium text-clay-600 hover:text-clay-700"
                  >
                    Edit
                  </Link>
                  <CourseDeleteButton courseId={c.id} courseTitle={c.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
