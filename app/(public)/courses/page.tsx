import Link from "next/link";
import { getPublishedCourses } from "@/lib/data/courses";
import { CourseCard } from "@/components/course/CourseCard";
import { FORMATS, LEVELS, TECHNIQUES } from "@/lib/courses/meta";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pottery Courses & Workshops | Ceramics Gallery",
  description: "Pottery tasters, weekend courses, 1:1 lessons and weekly classes with independent British potters.",
  alternates: { canonical: "/courses" },
};

interface Props { searchParams: Promise<{ technique?: string; level?: string; format?: string; q?: string }> }

export default async function CoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = {
    technique: TECHNIQUES.some((t) => t.value === sp.technique) ? sp.technique : undefined,
    level: LEVELS.some((l) => l.value === sp.level) ? sp.level : undefined,
    format: FORMATS.some((f) => f.value === sp.format) ? sp.format : undefined,
    q: sp.q?.slice(0, 60),
  };
  const courses = await getPublishedCourses(filters);
  const active = Object.values(filters).some(Boolean);

  const href = (k: string, v?: string) => {
    const p = new URLSearchParams(Object.entries({ ...filters, [k]: v }).filter(([, x]) => x) as [string, string][]);
    const s = p.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <div className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 border-b border-ink/15 pb-8">
          <p className="kicker">Courses & workshops</p>
          <h1 className="font-display text-6xl sm:text-7xl text-ink leading-none mt-3">
            Get your hands <em className="text-terracotta font-normal">in the clay.</em>
          </h1>
          <p className="text-ink/65 mt-5 max-w-xl text-lg">
            Tasters, weekend courses, 1:1 lessons and weekly classes, taught by working potters in their own studios.
          </p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          <aside className="flex flex-col gap-6 text-sm">
            <form action="/courses" className="flex gap-2">
              {filters.technique && <input type="hidden" name="technique" value={filters.technique} />}
              {filters.level && <input type="hidden" name="level" value={filters.level} />}
              {filters.format && <input type="hidden" name="format" value={filters.format} />}
              <input name="q" defaultValue={filters.q} placeholder="Search courses" className="input-field py-2" />
            </form>
            <FilterGroup title="Technique" items={TECHNIQUES} current={filters.technique} href={(v) => href("technique", v)} />
            <FilterGroup title="Format" items={FORMATS} current={filters.format} href={(v) => href("format", v)} />
            <FilterGroup title="Level" items={LEVELS.filter((l) => l.value !== "all")} current={filters.level} href={(v) => href("level", v)} />
            {active && <Link href="/courses" className="text-terracotta-dark underline underline-offset-2">Clear filters</Link>}
          </aside>

          <div>
            <p className="text-sm text-ink/65 mb-4">{courses.length} {courses.length === 1 ? "course" : "courses"}</p>
            {courses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-ink/20 p-10 text-center">
                <p className="font-display text-3xl text-ink">Nothing matches just now</p>
                <p className="text-ink/60 mt-2">{active ? "Try removing a filter." : "New courses are added all the time. Check back soon."}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {courses.map((c) => <CourseCard key={c.id} course={c} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, items, current, href }: {
  title: string; items: { value: string; label: string }[]; current?: string; href: (v?: string) => string;
}) {
  return (
    <div>
      <p className="kicker text-ink/65 mb-2">{title}</p>
      <div className="flex flex-wrap lg:flex-col gap-1.5 lg:gap-1">
        {items.map((i) => {
          const on = current === i.value;
          return (
            <Link key={i.value} href={href(on ? undefined : i.value)} scroll={false}
              className={`rounded-full lg:rounded-lg px-3 py-1 lg:px-2 lg:-mx-2 border lg:border-0 ${on ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70 hover:text-ink lg:hover:bg-ink/5"}`}>
              {i.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
