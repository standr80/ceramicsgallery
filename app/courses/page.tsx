import { getCourses, getCourseFilterOptions } from "@/lib/data";
import { CoursesView } from "@/components/courses/CoursesView";

export const metadata = {
  title: "Pottery Courses | Ceramics Gallery",
  description:
    "Face-to-face pottery courses with UK ceramacists. Filter by month, price, type, potter, duration, skill level and location.",
};

export default async function CoursesPage() {
  const courses = getCourses();
  const filterOptions = await getCourseFilterOptions();

  return (
    <div>
      <section className="bg-gradient-to-b from-clay-100 to-clay-50 py-12 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="font-display text-4xl font-semibold text-clay-900 sm:text-5xl">
            Pottery courses
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-stone-600">
            Face-to-face courses with our potters. Filter by month, price, type, potter, duration,
            skill level or location to find the right course for you.
          </p>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="mx-auto max-w-6xl">
          <CoursesView courses={courses} filterOptions={filterOptions} />
        </div>
      </section>
    </div>
  );
}
