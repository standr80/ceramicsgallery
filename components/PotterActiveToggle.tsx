"use client";

import { useState } from "react";
import { setPotterActive } from "@/app/actions/admin";

interface PotterActiveToggleProps {
  potterId: string;
  active: boolean;
}

export function PotterActiveToggle({ potterId, active: initialActive }: PotterActiveToggleProps) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const result = await setPotterActive(potterId, !active);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setActive(!active);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        active
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-stone-200 text-stone-600 hover:bg-stone-300"
      }`}
    >
      {loading ? "…" : active ? "Active" : "Inactive"}
    </button>
  );
}
