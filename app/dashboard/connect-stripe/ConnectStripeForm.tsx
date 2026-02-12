"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createConnectAccountLink } from "@/app/actions/stripe";

interface ConnectStripeFormProps {
  hasStripeAccount: boolean;
  connectAction: typeof createConnectAccountLink;
}

function SubmitButton({
  hasStripeAccount,
}: {
  hasStripeAccount: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending
        ? "Redirecting..."
        : hasStripeAccount
          ? "Complete setup or update details"
          : "Connect Stripe account"}
    </button>
  );
}

export function ConnectStripeForm({
  hasStripeAccount,
  connectAction,
}: ConnectStripeFormProps) {
  const [state, formAction] = useFormState(
    async (_: unknown, __: FormData) => connectAction(),
    null as { error?: string } | null
  );

  return (
    <form action={formAction}>
      {state?.error && (
        <p className="mb-4 text-red-600 text-sm">{state.error}</p>
      )}
      <SubmitButton hasStripeAccount={hasStripeAccount} />
    </form>
  );
}
