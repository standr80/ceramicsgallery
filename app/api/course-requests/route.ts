import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedCourse } from "@/lib/data/courses";
import { sendEmail, emailLayout, escapeHtml, potterEmail, siteUrl, ADMIN_BCC } from "@/lib/email";
import { fmtDayLong, fmtTimeRange, HOLD_HOURS } from "@/lib/courses/meta";

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !/[\r\n]/.test(e);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }

  if (body.website) return Response.json({ success: true }); // honeypot

  const courseId = clean(body.courseId, 40);
  const sessionId = clean(body.sessionId, 40) || null;
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40) || null;
  const message = clean(body.message, 2000) || null;
  const preferred = clean(body.preferredDates, 500) || null;
  const places = Math.max(1, Math.min(20, parseInt(String(body.places ?? 1), 10) || 1));

  if (!name || !email) return Response.json({ error: "Please add your name and email." }, { status: 400 });
  if (!isEmail(email)) return Response.json({ error: "That email address doesn't look right." }, { status: 400 });

  const course = await getPublishedCourse(courseId);
  if (!course) return Response.json({ error: "This course isn't available." }, { status: 404 });
  if (course.potter.is_demo) return Response.json({ error: "This is an example course, so booking is switched off." }, { status: 400 });
  if (course.external_booking_url) return Response.json({ error: "Please book through the potter's own booking page." }, { status: 400 });

  let session = null;
  if (course.booking_mode === "dates") {
    session = course.sessions.find((s) => s.id === sessionId);
    if (!session) return Response.json({ error: "Please choose a date." }, { status: 400 });
    if (session.places_left < places) {
      return Response.json({
        error: session.places_left === 0 ? "Sorry, that date is now full." : `Only ${session.places_left} place${session.places_left === 1 ? "" : "s"} left on that date.`,
      }, { status: 409 });
    }
  } else if (!preferred && !message) {
    return Response.json({ error: "Tell the potter when you'd like to come." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Light rate limit: max 5 requests per email per hour.
  const { count } = await admin.from("booking_requests").select("id", { count: "exact", head: true })
    .eq("email", email).gt("created_at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 5) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const { data: row, error } = await admin.from("booking_requests").insert({
    course_id: course.id, session_id: session?.id ?? null, potter_id: course.potter.id,
    name, email, phone, places, preferred_dates: preferred, message,
  }).select("id").single();
  if (error || !row) return Response.json({ error: "Could not send your request. Please try again." }, { status: 500 });

  const studio = course.potter.studio_name ?? course.potter.display_name;
  const when = session
    ? session.meetings.map((m) => `${fmtDayLong(m.starts_at)}, ${fmtTimeRange(m)}`).join("<br>")
    : escapeHtml(preferred ?? "See message");

  const to = await potterEmail(course.potter.id);
  if (to) {
    await sendEmail({
      to,
      bcc: ADMIN_BCC,
      replyTo: email,
      subject: `Booking request: ${course.title} (${places} place${places > 1 ? "s" : ""})`,
      html: emailLayout(`<p><strong>${escapeHtml(name)}</strong> would like to book <strong>${escapeHtml(course.title)}</strong>.</p>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
<tr><td style="padding:4px 12px 4px 0;color:#948875">When</td><td>${when}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#948875">Places</td><td>${places}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#948875">Email</td><td>${escapeHtml(email)}</td></tr>
${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#948875">Phone</td><td>${escapeHtml(phone)}</td></tr>` : ""}
</table>
${message ? `<blockquote style="border-left:3px solid #e5d2c0;padding-left:12px;color:#555">${escapeHtml(message).replace(/\n/g, "<br>")}</blockquote>` : ""}
<p>${session ? `Their place${places > 1 ? "s are" : " is"} held for ${HOLD_HOURS} hours.` : ""} Confirm or decline in your dashboard and we'll email them for you:</p>
<p><a href="${siteUrl()}/dashboard/courses/requests" style="display:inline-block;background:#221b17;color:#f5efe6;padding:10px 18px;border-radius:10px;text-decoration:none;font-family:Arial,sans-serif">Answer the request</a></p>`),
    });
  }

  await sendEmail({
    to: email,
    subject: `Request sent: ${course.title}`,
    html: emailLayout(`<p>Hi ${escapeHtml(name)},</p>
<p>Your request for <strong>${escapeHtml(course.title)}</strong> with ${escapeHtml(studio)} has been sent.</p>
<p><strong>When:</strong> ${when}<br><strong>Places:</strong> ${places}</p>
<p>${escapeHtml(studio)} will confirm by email${session ? `, usually within ${HOLD_HOURS} hours. Your place is held until then` : ""}. Nothing to pay yet.</p>`),
  });

  return Response.json({ success: true });
}
