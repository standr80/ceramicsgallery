"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Course } from "@/types";

interface CoursesViewProps {
  courses: Course[];
  filterOptions: {
    types: string[];
    potters: { slug: string; name: string }[];
    durations: string[];
    skillLevels: string[];
    locations: string[];
  };
}

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(price);
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function getCoursesByMonth(courses: Course[]): Map<string, Course[]> {
  const map = new Map<string, Course[]>();
  for (const c of courses) {
    const key = getMonthKey(c.startDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return map;
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const pad = Array<null>(startPad).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return [...pad, ...days];
}

export function CoursesView({ courses, filterOptions }: CoursesViewProps) {
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [priceRange, setPriceRange] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [potterFilter, setPotterFilter] = useState<string>("");
  const [durationFilter, setDurationFilter] = useState<string>("");
  const [skillLevelFilter, setSkillLevelFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const clearFilters = () => {
    setMonthFilter("");
    setPriceSort("none");
    setPriceRange("");
    setTypeFilter("");
    setPotterFilter("");
    setDurationFilter("");
    setSkillLevelFilter("");
    setLocationFilter("");
    setSelectedDate(null);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...courses];

    if (selectedDate) {
      result = result.filter((c) => c.startDate === selectedDate);
    }
    if (monthFilter) {
      result = result.filter((c) => getMonthKey(c.startDate) === monthFilter);
    }
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (potterFilter) {
      result = result.filter((c) => c.potterSlug === potterFilter);
    }
    if (durationFilter) {
      result = result.filter((c) => c.duration === durationFilter);
    }
    if (skillLevelFilter) {
      result = result.filter((c) => c.skillLevel === skillLevelFilter);
    }
    if (locationFilter) {
      result = result.filter((c) => c.location === locationFilter);
    }
    if (priceRange) {
      if (priceRange === "under-80") result = result.filter((c) => c.price < 80);
      else if (priceRange === "80-150") result = result.filter((c) => c.price >= 80 && c.price <= 150);
      else if (priceRange === "over-150") result = result.filter((c) => c.price > 150);
    }

    if (priceSort === "asc") result.sort((a, b) => a.price - b.price);
    else if (priceSort === "desc") result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => a.startDate.localeCompare(b.startDate));

    return result;
  }, [
    courses,
    selectedDate,
    monthFilter,
    priceSort,
    priceRange,
    typeFilter,
    potterFilter,
    durationFilter,
    skillLevelFilter,
    locationFilter,
  ]);

  const monthsWithCourses = useMemo(() => {
    const keys = [...new Set(courses.map((c) => getMonthKey(c.startDate)))].sort();
    return keys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { key, label: `${MONTH_LABELS[m - 1]} ${y}` };
    });
  }, [courses]);

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    return getCalendarDays(y, m - 1);
  }, [calendarMonth]);

  const coursesByDayInCalendarMonth = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const map = new Map<number, Course[]>();
    for (const c of courses) {
      const [cy, cm, cd] = c.startDate.split("-").map(Number);
      if (cy === y && cm === m) {
        if (!map.has(cd)) map.set(cd, []);
        map.get(cd)!.push(c);
      }
    }
    return map;
  }, [courses, calendarMonth]);

  const [calYear, calMonth] = calendarMonth.split("-").map(Number);
  const prevMonth = () => {
    if (calMonth === 1) setCalendarMonth(`${calYear - 1}-12`);
    else setCalendarMonth(`${calYear}-${String(calMonth - 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    if (calMonth === 12) setCalendarMonth(`${calYear + 1}-01`);
    else setCalendarMonth(`${calYear}-${String(calMonth + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-10">
      {/* Filters */}
      <section className="rounded-xl border border-clay-200/60 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Filter courses
          </h2>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-clay-300 bg-white px-4 py-2 text-sm font-medium text-clay-700 hover:bg-clay-50 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:ring-offset-2"
          >
            Clear filters
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-month" className="block text-sm font-medium text-stone-700 mb-1">
              View by month
            </label>
            <select
              id="filter-month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All months</option>
              {monthsWithCourses.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-price" className="block text-sm font-medium text-stone-700 mb-1">
              View by price
            </label>
            <select
              id="filter-price"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Any price</option>
              <option value="under-80">Under £80</option>
              <option value="80-150">£80 – £150</option>
              <option value="over-150">Over £150</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-price" className="block text-sm font-medium text-stone-700 mb-1">
              Sort by price
            </label>
            <select
              id="sort-price"
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as "none" | "asc" | "desc")}
              className="input-field w-full"
            >
              <option value="none">Date order</option>
              <option value="asc">Price: low to high</option>
              <option value="desc">Price: high to low</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-type" className="block text-sm font-medium text-stone-700 mb-1">
              View by type
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All types</option>
              {filterOptions.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-potter" className="block text-sm font-medium text-stone-700 mb-1">
              View by potter
            </label>
            <select
              id="filter-potter"
              value={potterFilter}
              onChange={(e) => setPotterFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All potters</option>
              {filterOptions.potters.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-duration" className="block text-sm font-medium text-stone-700 mb-1">
              View by duration
            </label>
            <select
              id="filter-duration"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All durations</option>
              {filterOptions.durations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-skill" className="block text-sm font-medium text-stone-700 mb-1">
              View by skill level
            </label>
            <select
              id="filter-skill"
              value={skillLevelFilter}
              onChange={(e) => setSkillLevelFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All levels</option>
              {filterOptions.skillLevels.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-location" className="block text-sm font-medium text-stone-700 mb-1">
              View by location
            </label>
            <select
              id="filter-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All locations</option>
              {filterOptions.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Calendar */}
        <section className="lg:col-span-1">
          <div className="rounded-xl border border-clay-200/60 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded p-1 text-stone-600 hover:bg-clay-100 hover:text-stone-900"
                aria-label="Previous month"
              >
                ←
              </button>
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {MONTH_LABELS[calMonth - 1]} {calYear}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded p-1 text-stone-600 hover:bg-clay-100 hover:text-stone-900"
                aria-label="Next month"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-stone-500">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }
                const dayCourses = coursesByDayInCalendarMonth.get(day) ?? [];
                const hasCourses = dayCourses.length > 0;
                const dateStr = `${calendarMonth}-${String(day).padStart(2, "0")}`;
                const isSelected = selectedDate === dateStr;
                const content = (
                  <>
                    <span>{day}</span>
                    {hasCourses && (
                      <span className="text-[10px] leading-tight">
                        {dayCourses.length} course{dayCourses.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </>
                );
                if (hasCourses) {
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square flex flex-col items-center justify-center rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-clay-500 focus:ring-offset-1 ${
                        isSelected
                          ? "bg-clay-600 text-white ring-2 ring-clay-600"
                          : "bg-clay-200/80 text-clay-900 hover:bg-clay-300/80"
                      }`}
                      title={`View ${dayCourses.length} course${dayCourses.length !== 1 ? "s" : ""} on this day: ${dayCourses.map((c) => c.title).join(", ")}`}
                      aria-pressed={isSelected}
                      aria-label={`Show courses on ${new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
                    >
                      {content}
                    </button>
                  );
                }
                return (
                  <div
                    key={day}
                    className="aspect-square flex flex-col items-center justify-center rounded text-sm text-stone-600"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course list */}
        <section className="lg:col-span-2">
          <div className="flex flex-wrap items-baseline gap-2 mb-4">
            <h2 className="font-display text-xl font-semibold text-stone-900">
              {filteredAndSorted.length} course{filteredAndSorted.length !== 1 ? "s" : ""} found
            </h2>
            {selectedDate && (
              <span className="text-sm text-stone-500">
                on {new Date(selectedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>
          <ul className="space-y-4">
            {filteredAndSorted.map((course) => (
              <li
                key={course.id}
                className="rounded-xl border border-clay-200/60 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/${course.potterSlug}`}
                      className="text-sm font-medium text-clay-600 hover:text-clay-700"
                    >
                      {filterOptions.potters.find((p) => p.slug === course.potterSlug)?.name ??
                        course.potterSlug}
                    </Link>
                    <h3 className="font-display text-lg font-semibold text-stone-900 mt-0.5">
                      {course.title}
                    </h3>
                  </div>
                  <p className="text-lg font-semibold text-clay-700">
                    {formatPrice(course.price, course.currency)}
                  </p>
                </div>
                <p className="mt-2 text-stone-600 text-sm leading-relaxed line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                  <span>{course.type}</span>
                  <span>·</span>
                  <span>{course.duration}</span>
                  {course.skillLevel && (
                    <>
                      <span>·</span>
                      <span>{course.skillLevel}</span>
                    </>
                  )}
                  {course.location && (
                    <>
                      <span>·</span>
                      <span>{course.location}</span>
                    </>
                  )}
                  <span>·</span>
                  <time dateTime={course.startDate}>
                    {new Date(course.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
