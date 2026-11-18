"use client";

import { useState } from "react";

type Session = { id: string; label: string; sub?: string; places_left: number };

export function RequestForm({ courseId, mode, sessions, potterName, maxPlaces }: {
  courseId: string;
  mode: "dates" | "on_request" | "ongoing";
  sessions: Session[];
  potterName: string;
  maxPlaces: number;
}) {
  const firstOpen = sessions.find((s) => s.places_left > 0)?.id ?? "";
  const [sessionId, setSessionId] = useState(firstOpen);
  const [places, setPlaces] = useState(1);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const chosen = sessions.find((s) => s.id === sessionId);
  const maxForDate = Math.min(chosen?.places_left ?? maxPlaces, 20);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/course-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId, sessionId: mode === "dates" ? sessionId : null, places,
        name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"),
        preferredDates: fd.get("preferred"), message: fd.get("message"), website: fd.get("website"),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      setError(json.error ?? "Something went wrong. Please try again.");
      setState("idle");
    } else setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-celadon-light/60 border border-celadon/40 p-6">
        <p className="kicker text-celadon-dark">Request sent</p>
        <p className="font-display text-3xl text-ink mt-2">Thank you!</p>
        <p className="text-ink/70 mt-2">
          {potterName} will confirm by email{mode === "dates" ? ". Your place is held for 48 hours meanwhile" : ""}. There&apos;s nothing to pay yet.
        </p>
      </div>
    );
  }

  if (mode === "dates" && !firstOpen) {
    return (
      <div className="rounded-3xl border border-ink/15 p-6">
        <p className="font-display text-2xl text-ink">Fully booked</p>
        <p className="text-ink/60 mt-1">All upcoming dates are full. Check back soon for new ones.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-ink/15 bg-white p-5 sm:p-6 flex flex-col gap-4">
      <p className="font-display text-2xl text-ink">{mode === "dates" ? "Request a place" : "Ask about booking"}</p>

      {mode === "dates" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium mb-1.5">Choose a date</legend>
          {sessions.map((s) => {
            const full = s.places_left === 0;
            return (
              <label key={s.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${full ? "opacity-45 cursor-not-allowed" : "cursor-pointer"} ${sessionId === s.id ? "border-ink bg-ink/[0.03]" : "border-ink/15"}`}>
                <input type="radio" name="session" value={s.id} disabled={full} checked={sessionId === s.id} onChange={() => { setSessionId(s.id); setPlaces(1); }} />
                <span className="flex-1">
                  <span className="block font-medium">{s.label}</span>
                  {s.sub && <span className="block text-ink/65 text-xs">{s.sub}</span>}
                </span>
                <span className={`text-xs ${full ? "" : s.places_left <= 2 ? "text-terracotta font-semibold" : "text-ink/65"}`}>
                  {full ? "Full" : `${s.places_left} left`}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {mode !== "dates" && (
        <label className="block text-sm font-medium">When would suit you?
          <input name="preferred" required className="input-field mt-1.5" placeholder="e.g. weekday mornings in January" />
        </label>
      )}

      <label className="block text-sm font-medium">Places
        <select value={places} onChange={(e) => setPlaces(Number(e.target.value))} className="input-field mt-1.5">
          {Array.from({ length: Math.max(1, maxForDate) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm font-medium">Your name
          <input name="name" required autoComplete="name" className="input-field mt-1.5" />
        </label>
        <label className="block text-sm font-medium">Email
          <input name="email" type="email" required autoComplete="email" className="input-field mt-1.5" />
        </label>
      </div>
      <label className="block text-sm font-medium">Phone <span className="font-normal text-ink/65">· optional</span>
        <input name="phone" type="tel" autoComplete="tel" className="input-field mt-1.5" />
      </label>
      <label className="block text-sm font-medium">Message <span className="font-normal text-ink/65">· optional</span>
        <textarea name="message" rows={3} className="input-field mt-1.5" placeholder="Any experience, access needs or questions" />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      <button disabled={state === "sending"} className="btn-primary py-3.5 text-base disabled:opacity-50">
        {state === "sending" ? "Sending…" : "Send request"}
      </button>
      <p className="text-xs text-ink/65 text-center">Free to request. {potterName} confirms by email and arranges payment with you.</p>
    </form>
  );
}
