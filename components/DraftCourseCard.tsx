"use client";

import { useState } from "react";
import Link from "next/link";
import { publishCourseDraft, discardCourseDraft } from "@/app/actions/agents";

interface DraftCourse {
  id: string;
  title: string;
  description: string;
  type: string | null;
  price: number;
  currency: string;
  duration: string | null;
  skill_level: string | null;
  location: string | null;
  start_date: string | null;
}

export function DraftCourseCard({ course }: { course: DraftCourse }) {
  const [status, setStatus] = useState<"idle" | "publishing" | "discarding" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePublish() {
    setStatus("publishing");
    const result = await publishCourseDraft(course.id);
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("done");
    }
  }

  async function handleDiscard() {
    if (!confirm(`Discard "${course.title}"? This cannot be undone.`)) return;
    setStatus("discarding");
    const result = await discardCourseDraft(course.id);
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("done");
    }
  }

  if (status === "done") return null;

  const priceLabel =
    course.price === 0
      ? "Price not set"
      : `${course.currency} ${Number(course.price).toFixed(2)}`;

  return (
    <div className="border border-stone-200 rounded-lg bg-white shadow-sm p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            {course.type && (
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">{course.type}</p>
            )}
            <h3 className="font-semibold text-stone-900 leading-snug">{course.title}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5">
            Course
          </span>
        </div>
        <p className="text-sm text-stone-600 mt-1">{course.description}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        <span>{priceLabel}</span>
        {course.duration && <span>{course.duration}</span>}
        {course.skill_level && <span className="capitalize">{course.skill_level}</span>}
        {course.location && <span>{course.location}</span>}
        {course.start_date && <span>Starts {course.start_date}</span>}
      </div>

      {status === "error" && (
        <p className="text-red-600 text-xs">{errorMsg}</p>
      )}

      {status === "error" && (
        <p className="text-red-600 text-xs">{errorMsg}</p>
      )}

      <div className="flex gap-2 pt-1 border-t border-stone-100">
        <button
          onClick={handlePublish}
          disabled={status !== "idle"}
          className="flex-1 bg-stone-900 text-white text-sm px-3 py-2 rounded hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {status === "publishing" ? "Publishing…" : "Publish"}
        </button>
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="flex-1 text-center border border-stone-300 text-stone-700 text-sm px-3 py-2 rounded hover:bg-stone-50 transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={handleDiscard}
          disabled={status !== "idle"}
          className="px-3 py-2 text-red-600 text-sm rounded border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
          title="Discard draft"
        >
          {status === "discarding" ? "…" : "Discard"}
        </button>
      </div>
    </div>
  );
}
