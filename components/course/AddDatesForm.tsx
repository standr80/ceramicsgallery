"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addSessions } from "@/app/actions/courses";

export function AddDatesForm({ courseId, defaultPlaces, multiWeek, defaultHours }: {
  courseId: string; defaultPlaces: number; multiWeek: boolean; defaultHours: number | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [repeat, setRepeat] = useState(multiWeek ? 5 : 1);
  const formRef = useRef<HTMLFormElement>(null);
  const endDefault = (() => {
    const mins = Math.round((defaultHours ?? 2) * 60) + 10 * 60;
    return `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  })();

  async function submit(fd: FormData) {
    setError(null);
    const res = await addSessions(courseId, fd);
    if (res?.error) setError(res.error);
    else { formRef.current?.reset(); setRepeat(multiWeek ? 5 : 1); }
  }

  return (
    <form ref={formRef} action={submit} className="rounded-2xl border border-ink/15 bg-white p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3">
        <label className="col-span-2 sm:col-span-1 text-sm font-medium">Date
          <input type="date" name="date" required className="input-field mt-1" />
        </label>
        <label className="text-sm font-medium">Starts
          <input type="time" name="start" required defaultValue="10:00" className="input-field mt-1" />
        </label>
        <label className="text-sm font-medium">Finishes
          <input type="time" name="end" required defaultValue={endDefault} className="input-field mt-1" />
        </label>
        <label className="text-sm font-medium">Places
          <input type="number" name="places" min={1} max={100} defaultValue={defaultPlaces} className="input-field mt-1" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <label className="flex items-center gap-2">
          Repeat weekly for
          <input type="number" name="repeat" min={1} max={26} value={repeat} onChange={(e) => setRepeat(Number(e.target.value) || 1)} className="input-field w-20 py-1.5" />
          week{repeat === 1 ? "" : "s"}
        </label>
        {repeat > 1 && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="as_one" defaultChecked={multiWeek} />
            Book as one course (people sign up for all {repeat} weeks)
          </label>
        )}
        <Submit />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn-primary ml-auto disabled:opacity-50">{pending ? "Adding…" : "Add date"}</button>
  );
}
