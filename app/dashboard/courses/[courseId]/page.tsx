import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";
import { EditCourseForm } from "@/components/EditCourseForm";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  const { courseId } = await params;
  const potter = await getCurrentPotter();
  if (!potter) return null;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("potter_id", potter.id)
    .single();

  if (!course) notFound();

  const isDraft = !course.active && course.source === "onboarding-scout";
  const backHref = isDraft ? "/dashboard/drafts" : "/dashboard/courses";
  const backLabel = isDraft ? "← Back to Drafts" : "← Back to courses";

  return (
    <div>
      <Link href={backHref} className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block">
        {backLabel}
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-2">
        {isDraft ? "Review course" : "Edit course"}
      </h2>
      {isDraft && (
        <p className="text-sm text-stone-500 mb-6">
          This course was imported by the Scout. Review and correct the details below, then publish when ready.
        </p>
      )}
      <EditCourseForm
        courseId={course.id}
        isDraft={isDraft}
        initialTitle={course.title}
        initialDescription={course.description}
        initialType={course.type ?? ""}
        initialPrice={Number(course.price)}
        initialCurrency={course.currency}
        initialDuration={course.duration ?? ""}
        initialSkillLevel={course.skill_level ?? ""}
        initialLocation={course.location ?? ""}
        initialStartDate={course.start_date ?? ""}
        initialMaxParticipants={course.max_participants ?? null}
        initialUrl={course.url ?? ""}
      />
    </div>
  );
}
