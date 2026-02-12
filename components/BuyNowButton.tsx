"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createBuyNowCheckout } from "@/app/actions/checkout";

interface BuyNowButtonProps {
  productId: string;
  potterId: string;
  createCheckoutAction: typeof createBuyNowCheckout;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-clay-600 px-6 py-3 text-base font-medium text-white hover:bg-clay-700 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? "Redirecting..." : "Buy now"}
    </button>
  );
}

export function BuyNowButton({
  productId,
  potterId,
  createCheckoutAction,
}: BuyNowButtonProps) {
  const [state, formAction] = useFormState(
    async (_: unknown, __: FormData) => createCheckoutAction(productId, potterId),
    null as { url?: string; error?: string } | null
  );

  useEffect(() => {
    if (state?.url) {
      window.location.href = state.url;
    }
  }, [state?.url]);

  return (
    <form action={formAction}>
      {state?.error && (
        <p className="mb-3 text-red-600 text-sm">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
