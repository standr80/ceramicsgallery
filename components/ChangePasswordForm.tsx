"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAndClearForceReset } from "@/app/actions/auth";

type FormState = { error?: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary mt-4 w-full disabled:opacity-70"
    >
      {pending ? "Updating…" : "Set new password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(
    async (_prevState: FormState, formData: FormData) => {
      const result = await changePasswordAndClearForceReset(formData);
      if (result && "error" in result) return { error: result.error };
      return null;
    },
    null as FormState
  );

  return (
    <form action={formAction} className="mt-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="input-field w-full"
          placeholder="At least 6 characters"
        />
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
