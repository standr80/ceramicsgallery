"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setPotterCommissionOverride } from "@/app/actions/admin";

interface PotterCommissionFormProps {
  potterId: string;
  defaultCommissionPercent: number;
  currentOverride: number | null;
}

type FormState = { error: string } | { success: boolean } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary text-sm disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save override"}
    </button>
  );
}

export function PotterCommissionForm({
  potterId,
  defaultCommissionPercent,
  currentOverride,
}: PotterCommissionFormProps) {
  const [state, formAction] = useFormState(
    async (_prevState: FormState, formData: FormData) => {
      const raw = formData.get("commission_override_percent");
      if (raw === "" || raw === null) {
        const result = await setPotterCommissionOverride(potterId, null);
        if (result && "error" in result) return { error: result.error };
        return { success: true };
      }
      const val = parseFloat(String(raw));
      const result = await setPotterCommissionOverride(
        potterId,
        isNaN(val) ? null : val
      );
      if (result && "error" in result) return { error: result.error };
      return { success: true };
    },
    null as FormState
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label
          htmlFor="commission_override_percent"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Commission override (%)
        </label>
        <p className="text-sm text-stone-500 mb-2">
          Default is {defaultCommissionPercent}%. Leave empty to use default, or
          enter a value to override for this potter.
        </p>
        <input
          type="number"
          id="commission_override_percent"
          name="commission_override_percent"
          min={0}
          max={100}
          step={0.5}
          placeholder={`${defaultCommissionPercent} (default)`}
          defaultValue={currentOverride ?? ""}
          className="w-full max-w-xs rounded-lg border border-clay-300 px-3 py-2 text-stone-900 focus:border-clay-500 focus:ring-1 focus:ring-clay-500"
        />
      </div>
      {state && "error" in state && <p className="text-red-600 text-sm">{state.error}</p>}
      {state && "success" in state && (
        <p className="text-green-600 text-sm">Override saved.</p>
      )}
      <SubmitButton />
    </form>
  );
}
