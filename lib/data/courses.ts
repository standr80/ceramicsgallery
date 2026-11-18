import { createAdminClient } from "@/lib/supabase/admin";
import { HOLD_HOURS } from "@/lib/courses/meta";
import type { BookingRequest, Course, CourseSession } from "@/types/database";

export type SessionWithPlaces = CourseSession & { places_left: number; requested: number; confirmed: number };

export type CoursePotter = {
  id: string;
  slug: string;
  display_name: string;
  studio_name: string | null;
  location_label: string | null;
  studio_address: string | null;
  is_demo: boolean;
};

export type PublicCourse = Course & { potter: CoursePotter; sessions: SessionWithPlaces[] };

const POTTER_COLS = "id, slug, display_name, studio_name, location_label, studio_address, is_demo, is_published";

/** Add places_left to sessions: total minus paid bookings, confirmed requests and unexpired pending requests. */
async function withPlaces(sessions: CourseSession[]): Promise<SessionWithPlaces[]> {
  if (sessions.length === 0) return [];
  const admin = createAdminClient();
  const { data: reqs } = await admin
    .from("booking_requests")
    .select("session_id, places, status, created_at")
    .in("session_id", sessions.map((s) => s.id))
    .in("status", ["pending", "confirmed"]);
  const holdFrom = Date.now() - HOLD_HOURS * 3600_000;
  return sessions.map((s) => {
    const mine = (reqs ?? []).filter((r) => r.session_id === s.id);
    const confirmed = mine.filter((r) => r.status === "confirmed").reduce((n, r) => n + r.places, 0);
    const requested = mine
      .filter((r) => r.status === "pending" && new Date(r.created_at).getTime() > holdFrom)
      .reduce((n, r) => n + r.places, 0);
    return {
      ...s,
      meetings: s.meetings?.length ? s.meetings : [{ starts_at: s.starts_at, ends_at: s.ends_at }],
      confirmed,
      requested,
      places_left: Math.max(0, s.places_total - s.places_booked - confirmed - requested),
    };
  });
}

async function attachSessions(courses: (Course & { potter: CoursePotter })[], upcomingOnly = true) {
  if (courses.length === 0) return [] as PublicCourse[];
  const admin = createAdminClient();
  let q = admin.from("course_sessions").select("*").in("course_id", courses.map((c) => c.id)).order("starts_at");
  if (upcomingOnly) q = q.gt("starts_at", new Date().toISOString()).eq("is_cancelled", false);
  const { data } = await q;
  const sessions = await withPlaces((data ?? []) as CourseSession[]);
  return courses.map((c) => ({ ...c, sessions: sessions.filter((s) => s.course_id === c.id) }));
}

export type CourseFilters = { technique?: string; level?: string; format?: string; q?: string };

export async function getPublishedCourses(filters: CourseFilters = {}): Promise<PublicCourse[]> {
  const admin = createAdminClient();
  let q = admin
    .from("courses")
    .select(`*, potter:potters!inner(${POTTER_COLS})`)
    .eq("is_published", true)
    .eq("potter.is_published", true);
  if (filters.technique) q = q.contains("techniques", [filters.technique]);
  if (filters.level) q = q.in("level", filters.level === "beginner" ? ["beginner", "all"] : [filters.level, "all"]);
  if (filters.format) q = q.eq("format", filters.format);
  if (filters.q) {
    const term = filters.q.replace(/[,()"'\\%_*:]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }
  const { data } = await q;
  const courses = await attachSessions((data ?? []) as PublicCourse[]);
  // Dated courses with no upcoming dates are hidden from the directory.
  const visible = courses.filter((c) => c.booking_mode !== "dates" || c.sessions.length > 0);
  const next = (c: PublicCourse) => (c.sessions[0] ? new Date(c.sessions[0].starts_at).getTime() : Infinity);
  return visible.sort((a, b) => next(a) - next(b) || a.title.localeCompare(b.title));
}

/** Looks a course up by its slug, or by its id for old links (the page then redirects to the slug). */
export async function getPublishedCourse(slugOrId: string): Promise<PublicCourse | null> {
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (!isId && !/^[a-z0-9-]{1,80}$/.test(slugOrId)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("courses")
    .select(`*, potter:potters!inner(${POTTER_COLS})`)
    .eq(isId ? "id" : "slug", slugOrId)
    .eq("is_published", true)
    .eq("potter.is_published", true)
    .maybeSingle();
  if (!data) return null;
  return (await attachSessions([data as PublicCourse]))[0];
}

export async function getCoursesForPotter(potterId: string): Promise<PublicCourse[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("courses")
    .select(`*, potter:potters!inner(${POTTER_COLS})`)
    .eq("potter_id", potterId)
    .eq("is_published", true)
    .order("created_at");
  const courses = await attachSessions((data ?? []) as PublicCourse[]);
  return courses.filter((c) => c.booking_mode !== "dates" || c.sessions.length > 0);
}

/* ── Dashboard ─────────────────────────────── */

export type MyCourse = Course & { sessions: SessionWithPlaces[]; pending_requests: number };

export async function getMyCourses(potterId: string): Promise<MyCourse[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("courses").select("*").eq("potter_id", potterId).order("created_at", { ascending: false });
  const courses = (data ?? []) as Course[];
  if (courses.length === 0) return [];
  const { data: sess } = await admin
    .from("course_sessions")
    .select("*")
    .in("course_id", courses.map((c) => c.id))
    .gt("starts_at", new Date().toISOString())
    .eq("is_cancelled", false)
    .order("starts_at");
  const sessions = await withPlaces((sess ?? []) as CourseSession[]);
  const { data: pend } = await admin
    .from("booking_requests")
    .select("course_id")
    .eq("potter_id", potterId)
    .eq("status", "pending");
  return courses.map((c) => ({
    ...c,
    sessions: sessions.filter((s) => s.course_id === c.id),
    pending_requests: (pend ?? []).filter((r) => r.course_id === c.id).length,
  }));
}

export async function getMyCourse(potterId: string, courseId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) return null;
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("*").eq("id", courseId).eq("potter_id", potterId).maybeSingle();
  if (!course) return null;
  const { data: sess } = await admin
    .from("course_sessions")
    .select("*")
    .eq("course_id", courseId)
    .gt("ends_at", new Date(Date.now() - 30 * 86400_000).toISOString())
    .order("starts_at");
  return { course: course as Course, sessions: await withPlaces((sess ?? []) as CourseSession[]) };
}

export type MyRequest = BookingRequest & {
  course: { title: string } | null;
  session: { starts_at: string; meetings: CourseSession["meetings"] } | null;
};

export async function getMyRequests(potterId: string, courseId?: string): Promise<MyRequest[]> {
  const admin = createAdminClient();
  let q = admin
    .from("booking_requests")
    .select("*, course:courses(title), session:course_sessions(starts_at, meetings)")
    .eq("potter_id", potterId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (courseId) q = q.eq("course_id", courseId);
  const { data } = await q;
  return (data ?? []) as MyRequest[];
}
