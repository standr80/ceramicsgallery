"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { buyPiece } from "@/app/actions/checkout";

type Option = { value: "ship" | "collect"; label: string; pence: number };
const gbp = (p: number) => `£${(p / 100).toFixed(2)}`;

export function BuyBox({ pieceId, pricePence, options }: { pieceId: string; pricePence: number; options: Option[] }) {
  const [choice, setChoice] = useState(options[0].value);
  const [state, action] = useFormState(buyPiece.bind(null, pieceId), null);
  const chosen = options.find((o) => o.value === choice) ?? options[0];

  return (
    <form action={action} className="rounded-2xl border border-ink/15 bg-white p-5 flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1.5">Delivery</legend>
        {options.map((o) => (
          <label key={o.value} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm cursor-pointer ${choice === o.value ? "border-ink bg-ink/[0.03]" : "border-ink/15"}`}>
            <input type="radio" name="fulfilment" value={o.value} checked={choice === o.value} onChange={() => setChoice(o.value)} />
            <span className="flex-1">{o.label}</span>
            <span className="text-ink/65">{o.pence ? gbp(o.pence) : "Free"}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink/65">Total</span>
        <span className="font-display text-3xl text-ink">{gbp(pricePence + chosen.pence)}</span>
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">{state.error}</p>}
      <BuyButton />
      <p className="text-xs text-ink/65 text-center">Secure card payment by Stripe. Paid straight to the potter.</p>
    </form>
  );
}

function BuyButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn-primary py-3.5 text-base disabled:opacity-60">
      {pending ? "Taking you to payment…" : "Buy now"}
    </button>
  );
}
