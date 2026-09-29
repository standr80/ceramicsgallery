"use client";

import { useState } from "react";
import { AddPieceFlow } from "./AddPieceFlow";

export function StudioAddButton({ label = "Add a pot" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-xl">
          <AddPieceFlow onDone={() => setOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13.5" r="3.5" />
      </svg>
      {label}
    </button>
  );
}
