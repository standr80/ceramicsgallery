import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const ADMIN_BCC = "richard@eventstuff.ltd";
const FROM = "Ceramics Gallery <noreply@ceramicsgallery.co.uk>";

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const oneLine = (t: string) => t.replace(/[\r\n]+/g, " ").slice(0, 120);

/** Simple branded wrapper so all emails look consistent. */
export function emailLayout(body: string) {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#221b17;line-height:1.55">
  <p style="font-size:20px;margin:0 0 20px">Ceramics <em style="color:#c0532d">Gallery</em></p>
  ${body}
  <hr style="border:none;border-top:1px solid #e5d2c0;margin:28px 0 12px">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#948875">Sent by ceramicsgallery.co.uk</p>
</div>`;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string; bcc?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const { error } = await new Resend(key).emails.send({ from: FROM, ...opts, subject: oneLine(opts.subject) });
  if (error) console.error("Email failed:", opts.subject, error);
  return !error;
}

/** The address a potter wants messages sent to. */
export async function potterEmail(potterId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: p } = await admin.from("potters").select("user_id, contact_email").eq("id", potterId).single();
  if (!p) return null;
  if (p.contact_email) return p.contact_email;
  const { data } = await admin.auth.admin.getUserById(p.user_id);
  return data.user?.email ?? null;
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.ceramicsgallery.co.uk";
}
