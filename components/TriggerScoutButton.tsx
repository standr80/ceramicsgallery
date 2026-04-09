"use client";

import { useState } from "react";

export function TriggerScoutButton({ potterId, hasWebsite }: { potterId: string; hasWebsite: boolean }) {
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (!hasWebsite) {
      setMessage("No website URL set. Add one in the Profile tab first.");
      setStatus("error");
      return;
    }
    setStatus("starting");
    setMessage("");

    try {
      const res = await fetch("/api/agents/trigger-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("running");
        setMessage("Scout is running in the background. Check the potter's Drafts page in 2–3 minutes.");
      }
    } catch {
      setMessage("Network error — please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        disabled={status === "starting" || status === "running"}
        className="inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
      >
        {status === "starting" ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
            Starting…
          </>
        ) : (
          <>
            <span>🔍</span>
            Run Onboarding Scout
          </>
        )}
      </button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
