import { createClient } from "@/lib/supabase/server";
import type { CourseDirectory } from "@/types/database";

export async function getCourseDirectory(limit = 50): Promise<CourseDirectory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_directory")
    .select("*")
    .order("starts_at")
    .limit(limit);
  return data ?? [];
}
