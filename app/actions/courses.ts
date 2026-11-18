"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FORMATS, LEVELS, TECHNIQUES, INCLUDED, londonToUtc, fmtDayLong, fmtTimeRange, cancellationText } from "@/lib/courses/meta";
import { sendEmail, emailLayout, escapeHtml, potterEmail, siteUrl } from "@/lib/email";
import type { CancellationPolicy, Meeting } from "@/types/database";

async function myPotter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient()
    .from("potters")
    .select("id, display_name, studio_name, studio_address, is_demo")
    .eq("user_id", user.id)
    .single();
  return data;
}

async function ownCourse(courseId: string) {
  const potter = await myPotter();
  if (!potter || !/^[0-9a-f-]{36}$/i.test(courseId)) return null;
  const { data } = await createAdminClient()
    .from("courses").select("*").eq("id", courseId).eq("potter_id", potter.id).maybeSingle();
  return data ? { potter, course: data } : null;
}

const str = (fd: FormData, k: string, max = 4000) => {
  const v = ((fd.get(k) as string) ?? "").trim().slice(0, max);
  return v || null;
};
const int = (fd: FormData, k: string, min = 0, max = 100000) => {
  const v = parseInt((fd.get(k) as string) ?? "", 10);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
};
const pounds = (fd: FormData, k: string) => {
  const raw = ((fd.get(k) as string) ?? "").replace(/[£,\s]/g, "");
  if (!raw) return null;
  const v = Math.round(parseFloat(raw) * 100);
  return Number.isFinite(v) && v >= 0 ? v : null;
};
const pick = <T extends string>(fd: FormData, k: string, allowed: readonly T[]) =>
  (fd.getAll(k) as string[]).filter((v): v is T => (allowed as readonly string[]).includes(v));

function parseCourse(fd: FormData) {
  const title = str(fd, "title", 120);
  if (!title) return { error: "Give your course a title." } as const;

  const format = (fd.get("format") as string) || "taster";
  if (!FORMATS.some((f) => f.value === format)) return { error: "Choose a format." } as const;
  const level = (fd.get("level") as string) || "all";
  if (!LEVELS.some((l) => l.value === level)) return { error: "Choose a level." } as const;
  const booking_mode = (fd.get("booking_mode") as string) || "dates";
  if (!["dates", "on_request", "ongoing"].includes(booking_mode)) return { error: "Choose how people book." } as const;

  const price_pence = pounds(fd, "price");
  if (price_pence == null) return { error: "Enter a price per person." } as const;

  const hours = parseFloat((fd.get("duration_hours") as string) ?? "");
  const policy = (fd.get("cancellation_policy") as CancellationPolicy) || "standard";
  if (!["flexible", "standard", "strict", "custom"].includes(policy)) return { error: "Choose a cancellation policy." } as const;
  const cancellation_text = str(fd, "cancellation_text", 1500);
  if (policy === "custom" && !cancellation_text) return { error: "Write your cancellation policy, or pick a standard one." } as const;

  let external_booking_url = str(fd, "external_booking_url", 500);
  if (external_booking_url) {
    if (!/^https?:\/\//i.test(external_booking_url)) external_booking_url = "https://" + external_booking_url;
    try { new URL(external_booking_url); } catch { return { error: "That booking link doesn't look like a web address." } as const; }
  }

  const image_paths = (fd.getAll("image_paths") as string[]).filter((p) => /^courses\/[\w-]+\.\w{2,5}$/.test(p)).slice(0, 6);

  return {
    data: {
      title,
      summary: str(fd, "summary", 200),
      description: str(fd, "description"),
      format,
      level,
      booking_mode,
      techniques: pick(fd, "techniques", TECHNIQUES.map((t) => t.value)),
      included: pick(fd, "included", INCLUDED.map((t) => t.value)),
      duration_minutes: Number.isFinite(hours) && hours > 0 ? Math.round(Math.min(hours, 72) * 60) : null,
      price_pence,
      private_price_pence: pounds(fd, "private_price"),
      private_max_people: int(fd, "private_max_people", 1, 50),
      max_places: int(fd, "max_places", 1, 100) ?? 6,
      min_age: int(fd, "min_age", 0, 99),
      what_youll_make: str(fd, "what_youll_make", 1000),
      prerequisites: str(fd, "prerequisites", 1000),
      pieces_fired: int(fd, "pieces_fired", 0, 50),
      extras: str(fd, "extras", 1000),
      collection_info: str(fd, "collection_info", 1000),
      venue_name: str(fd, "venue_name", 200),
      venue_address: str(fd, "venue_address", 500),
      is_online: format === "online",
      schedule_text: str(fd, "schedule_text", 1000),
      sessions_count: int(fd, "sessions_count", 1, 52),
      cancellation_policy: policy,
      cancellation_text: policy === "custom" ? cancellation_text : null,
      external_booking_url,
      image_paths,
      updated_at: new Date().toISOString(),
    },
  } as const;
}

export async function saveCourse(courseId: string | null, formData: FormData) {
  const potter = await myPotter();
  if (!potter) return { error: "Please sign in again." };
  const parsed = parseCourse(formData);
  if ("error" in parsed) return { error: parsed.error };
  const admin = createAdminClient();

  if (courseId) {
    if (!(await ownCourse(courseId))) return { error: "Course not found." };
    const { error } = await admin.from("courses").update(parsed.data).eq("id", courseId).eq("potter_id", potter.id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await admin
      .from("courses").insert({ ...parsed.data, potter_id: potter.id, is_published: false }).select("id").single();
    if (error || !data) return { error: error?.message ?? "Could not save." };
    courseId = data.id;
  }
  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  redirect(`/dashboard/courses/${courseId}?saved=1`);
}

export async function setCoursePublished(courseId: string, published: boolean) {
  const own = await ownCourse(courseId);
  if (!own) return;
  await createAdminClient().from("courses").update({ is_published: published }).eq("id", courseId);
  revalidatePath("/dashboard/courses", "layout");
  revalidatePath("/courses", "layout");
}

export async function duplicateCourse(courseId: string) {
  const own = await ownCourse(courseId);
  if (!own) return;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, slug, created_at, updated_at, search, location, ...rest } = own.course;
  const { data } = await createAdminClient()
    .from("courses")
    .insert({ ...rest, title: `${rest.title} (copy)`.slice(0, 120), is_published: false })
    .select("id").single();
  revalidatePath("/dashboard/courses");
  if (data) redirect(`/dashboard/courses/${data.id}`);
}

export async function deleteCourse(courseId: string) {
  const own = await ownCourse(courseId);
  if (!own) return { error: "Course not found." };
  const admin = createAdminClient();
  const { count } = await admin
    .from("booking_requests").select("id", { count: "exact", head: true })
    .eq("course_id", courseId).in("status", ["pending", "confirmed"]);
  if (count) return { error: "This course has open bookings. Cancel its dates first, or unpublish it instead." };
  await admin.from("courses").delete().eq("id", courseId);
  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  redirect("/dashboard/courses");
}

export async function addSessions(courseId: string, formData: FormData) {
  const own = await ownCourse(courseId);
  if (!own) return { error: "Course not found." };
  const date = (formData.get("date") as string) ?? "";
  const start = (formData.get("start") as string) ?? "";
  const end = (formData.get("end") as string) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return { error: "Choose a date, start and finish time." };
  }
  if (end <= start) return { error: "The finish time must be after the start time." };
  const places = int(formData, "places", 1, 100) ?? own.course.max_places;
  const repeat = int(formData, "repeat", 1, 26) ?? 1;
  const asOneCourse = formData.get("as_one") === "on";

  const meetings: Meeting[] = [];
  for (let w = 0; w < repeat; w++) {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + w * 7);
    const day = d.toISOString().slice(0, 10);
    meetings.push({ starts_at: londonToUtc(day, start), ends_at: londonToUtc(day, end) });
  }
  if (new Date(meetings[0].starts_at).getTime() < Date.now()) return { error: "That date is in the past." };

  const rows = asOneCourse
    ? [{ course_id: courseId, starts_at: meetings[0].starts_at, ends_at: meetings[0].ends_at, places_total: places, meetings }]
    : meetings.map((m) => ({ course_id: courseId, starts_at: m.starts_at, ends_at: m.ends_at, places_total: places, meetings: [m] }));
  const { error } = await createAdminClient().from("course_sessions").insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/courses", "layout");
  return { success: true };
}

export async function updateSessionPlaces(sessionId: string, courseId: string, places: number) {
  const own = await ownCourse(courseId);
  if (!own || !Number.isFinite(places) || places < 1 || places > 100) return;
  await createAdminClient().from("course_sessions").update({ places_total: Math.round(places) }).eq("id", sessionId).eq("course_id", courseId);
  revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function cancelSession(sessionId: string, courseId: string) {
  const own = await ownCourse(courseId);
  if (!own) return;
  const admin = createAdminClient();
  const { data: session } = await admin.from("course_sessions").select("*").eq("id", sessionId).eq("course_id", courseId).single();
  if (!session) return;

  const { data: reqs } = await admin
    .from("booking_requests").select("id, name, email, status")
    .eq("session_id", sessionId).in("status", ["pending", "confirmed"]);
  if (!reqs?.length) {
    // Nobody booked: just remove it.
    await admin.from("course_sessions").delete().eq("id", sessionId);
  } else {
    await admin.from("course_sessions").update({ is_cancelled: true }).eq("id", sessionId);
    await admin.from("booking_requests").update({ status: "cancelled", responded_at: new Date().toISOString() })
      .in("id", reqs.map((r) => r.id));
    const studio = own.potter.studio_name ?? own.potter.display_name;
    const replyTo = (await potterEmail(own.potter.id)) ?? undefined;
    for (const r of reqs) {
      await sendEmail({
        to: r.email,
        replyTo,
        subject: `Cancelled: ${own.course.title} on ${fmtDayLong(session.starts_at)}`,
        html: emailLayout(`<p>Hi ${escapeHtml(r.name)},</p>
<p>I'm sorry, but <strong>${escapeHtml(own.course.title)}</strong> on <strong>${fmtDayLong(session.starts_at)}</strong> has been cancelled.</p>
<p>If you'd already paid, I'll be in touch about a refund or another date. Just reply to this email if you have any questions.</p>
<p>${escapeHtml(studio)}</p>`),
      });
    }
  }
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/courses", "layout");
}

export async function respondToRequest(requestId: string, decision: "confirmed" | "declined", formData?: FormData) {
  const potter = await myPotter();
  if (!potter || !/^[0-9a-f-]{36}$/i.test(requestId)) return { error: "Not found." };
  const admin = createAdminClient();
  const { data: req } = await admin
    .from("booking_requests")
    .select("*, course:courses(*), session:course_sessions(*)")
    .eq("id", requestId).eq("potter_id", potter.id).single();
  if (!req || req.status !== "pending") return { error: "This request has already been answered." };

  const note = ((formData?.get("note") as string) ?? "").trim().slice(0, 1000) || null;

  if (decision === "confirmed" && req.session) {
    // Make sure confirming doesn't overbook (other pending holds may have expired or not).
    const { data: others } = await admin
      .from("booking_requests").select("places")
      .eq("session_id", req.session_id).eq("status", "confirmed");
    const taken = (others ?? []).reduce((n, r) => n + r.places, 0) + req.session.places_booked;
    if (taken + req.places > req.session.places_total) {
      return { error: `Only ${Math.max(0, req.session.places_total - taken)} place(s) left on that date. Add places to the date first, or decline.` };
    }
  }

  await admin.from("booking_requests")
    .update({ status: decision, potter_note: note, responded_at: new Date().toISOString() })
    .eq("id", requestId);

  const studio = potter.studio_name ?? potter.display_name;
  const course = req.course;
  const meetings: Meeting[] = req.session?.meetings?.length ? req.session.meetings
    : req.session ? [{ starts_at: req.session.starts_at, ends_at: req.session.ends_at }] : [];
  const when = meetings.length
    ? `<ul>${meetings.map((m) => `<li>${fmtDayLong(m.starts_at)}, ${fmtTimeRange(m)}</li>`).join("")}</ul>`
    : req.preferred_dates ? `<p>You asked for: ${escapeHtml(req.preferred_dates)}</p>` : "";
  const where = course.is_online ? "Online" : [course.venue_name, course.venue_address ?? potter.studio_address].filter(Boolean).join(", ");
  const noteHtml = note ? `<blockquote style="border-left:3px solid #e5d2c0;padding-left:12px;color:#555">${escapeHtml(note).replace(/\n/g, "<br>")}</blockquote>` : "";
  const replyTo = (await potterEmail(potter.id)) ?? undefined;

  if (decision === "confirmed") {
    await sendEmail({
      to: req.email,
      replyTo,
      subject: `Confirmed: ${course.title}`,
      html: emailLayout(`<p>Hi ${escapeHtml(req.name)},</p>
<p>Good news: your place${req.places > 1 ? `s (${req.places})` : ""} on <strong>${escapeHtml(course.title)}</strong> with ${escapeHtml(studio)} ${req.places > 1 ? "are" : "is"} confirmed.</p>
${when}
${where ? `<p><strong>Where:</strong> ${escapeHtml(where)}</p>` : ""}
${noteHtml}
<p><strong>Payment:</strong> ${escapeHtml(studio)} will let you know how to pay. Reply to this email to get in touch.</p>
<p style="font-size:13px;color:#555"><strong>Cancellation policy:</strong> ${escapeHtml(cancellationText(course.cancellation_policy, course.cancellation_text))}</p>`),
    });
  } else {
    await sendEmail({
      to: req.email,
      replyTo,
      subject: `About your request: ${course.title}`,
      html: emailLayout(`<p>Hi ${escapeHtml(req.name)},</p>
<p>Thanks for your interest in <strong>${escapeHtml(course.title)}</strong>. Unfortunately ${escapeHtml(studio)} can't offer you a place this time.</p>
${noteHtml}
<p>You can see other dates and courses at <a href="${siteUrl()}/courses/${course.slug}">ceramicsgallery.co.uk</a>.</p>`),
    });
  }

  revalidatePath("/dashboard/courses", "layout");
  revalidatePath("/courses", "layout");
  return { success: true };
}
