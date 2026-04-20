"use client";

import { useState } from "react";
import { deleteCourse } from "@/app/actions/courses";

export function CourseDeleteButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete "${courseTitle}"? This cannot be undone.`)) return;
    setStatus("deleting");
    const result = await deleteCourse(courseId);
    if (result.error) {
      setError(result.error);
      setStatus("error");
    }
    // On success the server revalidates and the row disappears
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={status === "deleting"}
        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {status === "deleting" ? "Deleting…" : "Delete"}
      </button>
      {status === "error" && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
