"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deletePotter } from "@/app/actions/admin";

interface PotterDeleteButtonProps {
  potterId: string;
  potterName: string;
}

export function PotterDeleteButton({ potterId, potterName }: PotterDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleConfirm() {
    setLoading(true);
    const result = await deletePotter(potterId);
    setLoading(false);
    setOpen(false);

    if (result && "error" in result) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
      >
        Delete
      </button>
      <dialog
        ref={dialogRef}
        onCancel={() => setOpen(false)}
        className="rounded-xl border border-clay-200/60 bg-white p-6 shadow-lg backdrop:bg-black/20 backdrop:backdrop-blur-sm max-w-md"
      >
        <h3 className="font-display text-lg font-semibold text-stone-900">
          Delete potter?
        </h3>
        <p className="mt-2 text-stone-600 text-sm">
          This will permanently delete <strong>{potterName}</strong> and all their
          products. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-70"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
