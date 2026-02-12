"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateDefaultCommission } from "@/app/actions/settings";

interface SettingsFormProps {
  defaultCommissionPercent: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save settings"}
    </button>
  );
}

export function SettingsForm({
  defaultCommissionPercent,
}: SettingsFormProps) {
  const [state, formAction] = useFormState(
    async (_: unknown, formData: FormData) => updateDefaultCommission(formData),
    null as { success?: boolean; error?: string } | null
  );

  return (
    <form action={formAction} className="space-y-6 max-w-md">
      <div>
        <label
          htmlFor="default_commission_percent"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Default Potter Commission (%)
        </label>
        <p className="text-sm text-stone-500 mb-2">
          Percentage taken from each sale (net of tax) before paying the potter.
          Can be overridden per potter.
        </p>
        <input
          type="number"
          id="default_commission_percent"
          name="default_commission_percent"
          min={0}
          max={100}
          step={0.5}
          defaultValue={defaultCommissionPercent}
          className="w-full rounded-lg border border-clay-300 px-3 py-2 text-stone-900 focus:border-clay-500 focus:ring-1 focus:ring-clay-500"
        />
      </div>
      {state?.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-600 text-sm">Settings saved.</p>
      )}
      <SubmitButton />
    </form>
  );
}
