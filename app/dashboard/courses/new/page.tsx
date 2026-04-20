import Link from "next/link";
import { AddCourseForm } from "@/components/AddCourseForm";

export default function NewCoursePage() {
  return (
    <div>
      <Link
        href="/dashboard/courses"
        className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block"
      >
        ← Back to courses
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-6">
        Add course
      </h2>
      <AddCourseForm />
    </div>
  );
}
