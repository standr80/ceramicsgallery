import { getCourseDirectory } from "@/lib/data/courses";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pottery Courses | Ceramics Gallery",
  description: "Find pottery courses with British ceramicists.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

export default async function CoursesPage() {
  const courses = await getCourseDirectory();

  return (
    <div className="py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-8">Pottery courses</h1>
        {courses.length === 0 ? (
          <p className="text-stone-500">No upcoming courses listed yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((c) => (
              <div key={c.session_id} className="card p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-stone-900">{c.title}</h2>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {c.potter_name} · {c.is_online ? "Online" : c.venue_name}
                  </p>
                  <p className="text-sm text-stone-500 mt-1">{formatDate(c.starts_at)}</p>
                  <p className="text-xs text-stone-400 mt-1 capitalize">{c.format.replace("_", " ")} · {c.level}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-semibold text-clay-700">£{(c.price_pence / 100).toFixed(0)}</p>
                  <p className="text-xs text-stone-400">{c.places_left} place{c.places_left !== 1 ? "s" : ""} left</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
