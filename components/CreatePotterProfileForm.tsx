"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPotterProfileForAdmin } from "@/app/actions/admin";

type FormState = { error: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-70"
    >
      {pending ? "Creating..." : "Create potter profile"}
    </button>
  );
}

export function CreatePotterProfileForm() {
  const [state, formAction] = useFormState(
    async (_prevState: FormState, formData: FormData) => {
      const result = await createPotterProfileForAdmin(formData);
      if ("error" in result) return { error: result.error };
      return null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="input"
          placeholder="Your display name"
        />
      </div>
      <div>
        <label htmlFor="biography" className="block text-sm font-medium text-stone-700 mb-1">
          Biography
        </label>
        <textarea
          id="biography"
          name="biography"
          required
          rows={4}
          className="input"
          placeholder="Tell visitors about yourself and your work"
        />
      </div>
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-stone-700 mb-1">
          Website (optional)
        </label>
        <input
          id="website"
          name="website"
          type="url"
          className="input"
          placeholder="https://"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
