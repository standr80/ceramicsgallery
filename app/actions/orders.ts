"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPotter } from "@/lib/get-potter";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, potterEmail, sendEmail } from "@/lib/email";

async function ownOrder(orderId: string) {
  const potter = await getCurrentPotter();
  if (!potter) return null;
  const { data } = await createAdminClient().from("orders")
    .select("id, status, fulfilment, buyer_email, buyer_name, piece:pieces(title)")
    .eq("id", orderId).eq("potter_id", potter.id).maybeSingle();
  return data ? { potter, order: data as unknown as { id: string; status: string; fulfilment: string; buyer_email: string | null; buyer_name: string | null; piece: { title: string } } } : null;
}

export async function markDispatched(orderId: string, fd: FormData) {
  const own = await ownOrder(orderId);
  if (!own || own.order.status !== "paid" || own.order.fulfilment !== "ship") return;
  const tracking = String(fd.get("tracking") ?? "").trim().slice(0, 80) || null;
  await createAdminClient().from("orders")
    .update({ status: "dispatched", dispatched_at: new Date().toISOString(), tracking_ref: tracking })
    .eq("id", orderId);
  const studio = own.potter.studio_name ?? own.potter.display_name;
  if (own.order.buyer_email) {
    await sendEmail({
      to: own.order.buyer_email,
      replyTo: (await potterEmail(own.potter.id)) ?? undefined,
      subject: `On its way: ${own.order.piece.title}`,
      html: emailLayout(`<p>Good news${own.order.buyer_name ? `, ${escapeHtml(own.order.buyer_name.split(" ")[0])}` : ""}: ${escapeHtml(studio)} has posted <strong>${escapeHtml(own.order.piece.title)}</strong>.</p>
${tracking ? `<p>Tracking reference: <strong>${escapeHtml(tracking)}</strong></p>` : ""}
<p>Reply to this email if you have any questions about your delivery.</p>`),
    });
  }
  revalidatePath("/dashboard/orders");
}

export async function markCollected(orderId: string) {
  const own = await ownOrder(orderId);
  if (!own || own.order.status !== "paid" || own.order.fulfilment !== "collect") return;
  await createAdminClient().from("orders")
    .update({ status: "collected", collected_at: new Date().toISOString() })
    .eq("id", orderId);
  revalidatePath("/dashboard/orders");
}
