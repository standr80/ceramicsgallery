import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { potterId, potterSlug, courseId, courseTitle, senderName, senderEmail, message } =
    await req.json();

  if (!potterId || !senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up potter's auth email (not stored in potters table)
  const { data: potter } = await admin
    .from("potters")
    .select("name, auth_user_id")
    .eq("id", potterId)
    .single();

  if (!potter) return Response.json({ error: "Potter not found." }, { status: 404 });

  const { data: authUser } = await admin.auth.admin.getUserById(potter.auth_user_id);
  const potterEmail = authUser?.user?.email;

  if (!potterEmail) {
    return Response.json({ error: "Could not find potter's email." }, { status: 500 });
  }

  // Save enquiry to DB
  await admin.from("contact_enquiries").insert({
    potter_id: potterId,
    course_id: courseId || null,
    sender_name: senderName.trim(),
    sender_email: senderEmail.trim(),
    message: message.trim(),
  });

  // Send email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[contact] RESEND_API_KEY not configured");
    // Still return success — message is saved to DB even if email fails
    return Response.json({ success: true, emailSent: false });
  }

  const resend = new Resend(resendKey);
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const subject = courseTitle
    ? `Ceramics Gallery: Enquiry about "${courseTitle}"`
    : `Ceramics Gallery: New message from ${senderName}`;

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceramicsgallery.co.uk";

  const html = `
    <p><strong>From:</strong> ${senderName} &lt;${senderEmail}&gt;</p>
    ${courseTitle ? `<p><strong>Course enquiry:</strong> ${courseTitle}</p>` : ""}
    <p><strong>Message:</strong></p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${message.trim().replace(/\n/g, "<br>")}</blockquote>
    <hr>
    <p style="color:#888;font-size:12px">
      Sent via Ceramics Gallery contact form.<br>
      Reply directly to this email to respond to ${senderName}.
    </p>
  `;

  const fromAddress = "Ceramics Gallery <noreply@ceramicsgallery.co.uk>";

  await resend.emails.send({
    from: fromAddress,
    to: potterEmail,
    ...(adminEmails.length > 0 ? { bcc: adminEmails } : {}),
    replyTo: senderEmail,
    subject,
    html,
  });

  return Response.json({ success: true, emailSent: true });
}
