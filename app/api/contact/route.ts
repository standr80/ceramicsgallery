import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.includes("\r") && !email.includes("\n");
}

export async function POST(req: Request) {
  const { potterId, courseId, courseTitle, senderName, senderEmail, message } =
    await req.json();

  if (!potterId || !senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!isValidEmail(senderEmail)) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: potter } = await admin
    .from("potters")
    .select("display_name, user_id")
    .eq("id", potterId)
    .single();
  if (!potter) return Response.json({ error: "Potter not found." }, { status: 404 });

  const { data: authUser } = await admin.auth.admin.getUserById(potter.user_id);
  const potterEmail = authUser?.user?.email;
  if (!potterEmail) return Response.json({ error: "Could not find potter email." }, { status: 500 });

  await admin.from("contact_enquiries").insert({
    potter_id: potterId,
    course_id: courseId ?? null,
    sender_name: senderName.trim(),
    sender_email: senderEmail.trim(),
    message: message.trim(),
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return Response.json({ success: true, emailSent: false });

  const resend = new Resend(resendKey);
  const subject = courseTitle
    ? `Ceramics Gallery: Enquiry about "${escapeHtml(courseTitle)}"`
    : `Ceramics Gallery: Message from ${escapeHtml(senderName)}`;

  const html = `
    <p><strong>From:</strong> ${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;</p>
    ${courseTitle ? `<p><strong>Course:</strong> ${escapeHtml(courseTitle)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">
      ${escapeHtml(message.trim()).replace(/\n/g, "<br>")}
    </blockquote>
    <hr>
    <p style="color:#888;font-size:12px">Sent via Ceramics Gallery contact form. Reply to respond to ${escapeHtml(senderName)}.</p>
  `;

  await resend.emails.send({
    from: "Ceramics Gallery <noreply@ceramicsgallery.co.uk>",
    to: potterEmail,
    replyTo: senderEmail,
    subject,
    html,
  });

  return Response.json({ success: true, emailSent: true });
}
