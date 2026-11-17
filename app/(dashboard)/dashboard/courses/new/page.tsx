import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPotter } from "@/lib/get-potter";
import { CourseForm } from "@/components/course/CourseForm";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard/courses" className="text-sm text-ink/55 hover:text-ink">← Courses</Link>
        <h1 className="font-display text-4xl text-ink mt-2">Add a course</h1>
      </div>
      <CourseForm studioAddress={potter.studio_address} />
    </div>
  );
}
