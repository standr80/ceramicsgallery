"use client";

import { useState } from "react";

interface Props {
  potterId: string;
  potterName: string;
  pieceTitle?: string;
  label?: string;
}

export function EnquiryButton({ potterId, potterName, pieceTitle, label = "Email enquiry" }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          potterId,
          pieceTitle,
          senderName: fd.get("name"),
          senderEmail: fd.get("email"),
          message: fd.get("message"),
          website: fd.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send your message.");
      setStatus("sent");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send your message.");
      setStatus("error");
    }
  }

  function close() {
    setOpen(false);
    setStatus("idle");
    setError(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary inline-flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
            className="relative bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {status === "sent" ? (
              <div className="text-center py-6 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F5E3A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-semibold">Message sent</h2>
                <p className="text-stone-500">{potterName} will reply to you by email.</p>
                <button type="button" onClick={close} className="btn-primary mt-2">Close</button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="pr-8">
                  <h2 id="enquiry-title" className="font-display text-2xl font-semibold">Message {potterName}</h2>
                  {pieceTitle && <p className="text-stone-500 mt-1">About: {pieceTitle}</p>}
                </div>
                <div>
                  <label htmlFor="enq-name" className="block text-sm font-medium mb-1.5">Your name</label>
                  <input id="enq-name" name="name" type="text" required autoComplete="name" className="input-field" />
                </div>
                <div>
                  <label htmlFor="enq-email" className="block text-sm font-medium mb-1.5">Your email</label>
                  <input id="enq-email" name="email" type="email" required autoComplete="email" className="input-field" />
                </div>
                <div>
                  <label htmlFor="enq-message" className="block text-sm font-medium mb-1.5">Message</label>
                  <textarea
                    id="enq-message"
                    name="message"
                    rows={5}
                    required
                    className="input-field resize-y"
                    defaultValue={pieceTitle ? `Hello, I'm interested in "${pieceTitle}". Is it still available?` : ""}
                  />
                </div>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
                <button type="submit" disabled={status === "sending"} className="btn-primary w-full py-3 disabled:opacity-50">
                  {status === "sending" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
