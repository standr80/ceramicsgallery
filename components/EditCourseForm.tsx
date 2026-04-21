"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateCourse, publishAndSaveCourse } from "@/app/actions/courses";

interface EditCourseFormProps {
  courseId: string;
  isDraft?: boolean;
  initialTitle: string;
  initialDescription: string;
  initialType: string;
  initialPrice: number;
  initialCurrency: string;
  initialDuration: string;
  initialSkillLevel: string;
  initialLocation: string;
  initialStartDate: string;
  initialMaxParticipants: number | null;
  initialUrl: string;
}

const SKILL_LEVELS = ["", "beginner", "intermediate", "advanced", "all"];

export function EditCourseForm({
  courseId,
  isDraft = false,
  initialTitle,
  initialDescription,
  initialType,
  initialPrice,
  initialCurrency,
  initialDuration,
  initialSkillLevel,
  initialLocation,
  initialStartDate,
  initialMaxParticipants,
  initialUrl,
}: EditCourseFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const busy = saving || publishing;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateCourse(courseId, formData);
    setSaving(false);
    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
    } else {
      setSuccess(true);
    }
  }

  async function handlePublish() {
    if (!formRef.current) return;
    setError(null);
    setSuccess(false);
    setPublishing(true);
    const formData = new FormData(formRef.current);
    const result = await publishAndSaveCourse(courseId, formData);
    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
      setPublishing(false);
    } else {
      router.push("/dashboard/drafts");
    }
  }

  const cancelHref = isDraft ? "/dashboard/drafts" : "/dashboard/courses";

  return (
    <form ref={formRef} onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Draft saved.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
        <input
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
        <textarea
          name="description"
          rows={4}
          required
          defaultValue={initialDescription}
          className="input-field resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
          <input
            name="type"
            type="text"
            defaultValue={initialType}
            className="input-field"
            placeholder="e.g. Wheel throwing, One-day workshop"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Duration</label>
          <input
            name="duration"
            type="text"
            defaultValue={initialDuration}
            className="input-field"
            placeholder="e.g. 1 day, 6 weeks"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Price *</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initialPrice}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Currency</label>
          <input
            name="currency"
            type="text"
            defaultValue={initialCurrency}
            maxLength={3}
            className="input-field uppercase"
            placeholder="GBP"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Skill level</label>
          <select name="skill_level" defaultValue={initialSkillLevel} className="input-field">
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l ? l.charAt(0).toUpperCase() + l.slice(1) : "— Not specified —"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Max participants</label>
          <input
            name="max_participants"
            type="number"
            min="1"
            defaultValue={initialMaxParticipants ?? ""}
            className="input-field"
            placeholder="e.g. 8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
          <input
            name="location"
            type="text"
            defaultValue={initialLocation}
            className="input-field"
            placeholder="e.g. Bristol studio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Start date</label>
          <input
            name="start_date"
            type="date"
            defaultValue={initialStartDate}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Course page URL</label>
        <input
          name="url"
          type="url"
          defaultValue={initialUrl}
          className="input-field"
          placeholder="https://yourwebsite.com/courses/wheel-throwing"
        />
        <p className="mt-1 text-xs text-stone-400">
          Link to this course on your own website. Shown to visitors on Ceramics Gallery.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {isDraft ? (
          <>
            <button
              type="submit"
              disabled={busy}
              className="btn-secondary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handlePublish}
              className="btn-primary disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </>
        ) : (
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {saving ? "Saving…" : "Save course"}
          </button>
        )}
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          aria-disabled={busy}
          tabIndex={busy ? -1 : undefined}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
