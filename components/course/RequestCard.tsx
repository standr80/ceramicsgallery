"use client";

import { useState } from "react";
import { respondToRequest } from "@/app/actions/courses";

type Req = {
  id: string; name: string; email: string; phone: string | null; places: number; preferred_dates: string | null;
  message: string | null; status: string; potter_note: string | null; created_at: string;
  courseTitle?: string; when?: string; expired?: boolean;
};

const STATUS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-green-100 text-green-800",
  declined: "bg-stone-200 text-stone-600",
  cancelled: "bg-stone-200 text-stone-600",
};

export function RequestCard({ r }: { r: Req }) {
  const [busy, setBusy] = useState<"confirmed" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  async function answer(decision: "confirmed" | "declined") {
    setBusy(decision);
    setError(null);
    const fd = new FormData();
    fd.set("note", note);
    const res = await respondToRequest(r.id, decision, fd);
    if (res?.error) setError(res.error);
    setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-ink/12 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {r.name} <span className="font-normal text-ink/65">· {r.places} place{r.places > 1 ? "s" : ""}</span>
          </p>
          {r.courseTitle && <p className="text-sm text-ink/70">{r.courseTitle}</p>}
          <p className="text-sm text-ink/70">{r.when ?? r.preferred_dates ?? "No date given"}</p>
          <p className="text-sm mt-1">
            <a href={`mailto:${r.email}`} className="text-terracotta-dark hover:underline">{r.email}</a>
            {r.phone && <> · <a href={`tel:${r.phone}`} className="text-terracotta-dark hover:underline">{r.phone}</a></>}
          </p>
        </div>
        <span className={`text-xs font-semibold rounded-full px-2.5 py-1 capitalize ${STATUS[r.status]}`}>
          {r.status === "pending" && r.expired ? "Waiting (hold expired)" : r.status}
        </span>
      </div>
      {r.message && <p className="mt-3 text-sm text-ink/75 whitespace-pre-line border-l-2 border-clay-200 pl-3">{r.message}</p>}
      {r.potter_note && r.status !== "pending" && <p className="mt-3 text-xs text-ink/65">Your note: {r.potter_note}</p>}
      <p className="mt-3 text-xs text-ink/65">
        Received {new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
      </p>

      {r.status === "pending" && (
        <div className="mt-4 flex flex-col gap-3">
          {showNote ? (
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input-field text-sm"
              placeholder="Optional message, e.g. how to pay, what to bring, or another date you could offer" />
          ) : (
            <button type="button" onClick={() => setShowNote(true)} className="self-start text-sm text-ink/60 underline underline-offset-2">Add a message</button>
          )}
          <div className="flex gap-2">
            <button onClick={() => answer("confirmed")} disabled={!!busy} className="btn-primary disabled:opacity-50">
              {busy === "confirmed" ? "Confirming…" : "Confirm"}
            </button>
            <button onClick={() => answer("declined")} disabled={!!busy} className="btn-secondary disabled:opacity-50">
              {busy === "declined" ? "Declining…" : "Decline"}
            </button>
          </div>
          <p className="text-xs text-ink/65">We&apos;ll email {r.name.split(" ")[0]} your answer. Replies come straight to you.</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
