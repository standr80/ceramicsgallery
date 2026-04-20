"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/app/actions/courses";

const SKILL_LEVELS = ["", "beginner", "intermediate", "advanced", "all"];

export function AddCourseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCourse(formData);
    setSaving(false);
    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
    } else {
      router.push("/dashboard/courses");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
        <input name="title" type="text" required className="input-field" placeholder="e.g. Beginner Wheel Throwing" />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
        <textarea name="description" rows={4} required className="input-field resize-y" placeholder="What will students learn and experience?" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
          <input name="type" type="text" className="input-field" placeholder="e.g. Wheel throwing" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Duration</label>
          <input name="duration" type="text" className="input-field" placeholder="e.g. 1 day, 6 weeks" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Price *</label>
          <input name="price" type="number" min="0" step="0.01" required defaultValue="0" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Currency</label>
          <input name="currency" type="text" defaultValue="GBP" maxLength={3} className="input-field uppercase" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Skill level</label>
          <select name="skill_level" defaultValue="" className="input-field">
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l ? l.charAt(0).toUpperCase() + l.slice(1) : "— Not specified —"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Max participants</label>
          <input name="max_participants" type="number" min="1" className="input-field" placeholder="e.g. 8" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
          <input name="location" type="text" className="input-field" placeholder="e.g. Bristol studio" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Start date</label>
          <input name="start_date" type="date" className="input-field" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Course page URL</label>
        <input name="url" type="url" className="input-field" placeholder="https://yourwebsite.com/courses/..." />
        <p className="mt-1 text-xs text-stone-400">
          Leave blank if you don't have a website — visitors will be able to contact you directly.
        </p>
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : "Add course"}
        </button>
      </div>
    </form>
  );
}
