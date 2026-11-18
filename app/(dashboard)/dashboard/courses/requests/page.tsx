import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPotter } from "@/lib/get-potter";
import { getMyRequests } from "@/lib/data/courses";
import { RequestCard } from "@/components/course/RequestCard";
import { HOLD_HOURS, fmtDay } from "@/lib/courses/meta";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");
  const requests = await getMyRequests(potter.id);
  const holdFrom = Date.now() - HOLD_HOURS * 3600_000;
  const shape = (r: (typeof requests)[number]) => ({
    ...r,
    courseTitle: r.course?.title,
    when: r.session
      ? (r.session.meetings?.length ? r.session.meetings.map((m) => fmtDay(m.starts_at)).join(", ") : fmtDay(r.session.starts_at))
      : undefined,
    expired: new Date(r.created_at).getTime() < holdFrom,
  });
  const open = requests.filter((r) => r.status === "pending");
  const done = requests.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <Link href="/dashboard/courses" className="text-sm text-ink/65 hover:text-ink">← Courses</Link>
        <h1 className="font-display text-4xl text-ink mt-2">Booking requests</h1>
        <p className="text-ink/60 mt-1">
          Places on dated courses are held for {HOLD_HOURS} hours while you decide. Confirming or declining emails the person for you.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl text-ink">To answer ({open.length})</h2>
        {open.length === 0 ? <p className="text-sm text-ink/65">You&apos;re all caught up.</p> : open.map((r) => <RequestCard key={r.id} r={shape(r)} />)}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl text-ink">Answered</h2>
          {done.map((r) => <RequestCard key={r.id} r={shape(r)} />)}
        </section>
      )}
    </div>
  );
}
