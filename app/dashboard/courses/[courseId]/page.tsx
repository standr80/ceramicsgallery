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

  return (
    <div>
      <Link
        href="/dashboard/drafts"
        className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block"
      >
        ← Back to Agents
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-6">
        Edit course
      </h2>
      <EditCourseForm
        courseId={course.id}
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
      />
    </div>
  );
}
