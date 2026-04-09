"use client";

import { useState } from "react";
import { triggerScout } from "@/app/actions/admin";

export function TriggerScoutButton({ potterId, hasWebsite }: { potterId: string; hasWebsite: boolean }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (!hasWebsite) {
      setMessage("No website URL set. Add one in the Profile tab first.");
      setStatus("error");
      return;
    }
    setStatus("running");
    setMessage("");
    const result = await triggerScout(potterId);
    if (result.error) {
      setMessage(result.error);
      setStatus("error");
    } else {
      setMessage(`Done — ${result.inserted} draft${result.inserted === 1 ? "" : "s"} created.`);
      setStatus("done");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={status === "running"}
        className="inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
      >
        {status === "running" ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
            Crawling website…
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
      {status === "running" && (
        <p className="text-xs text-stone-500">This can take 2–3 minutes. You can navigate away — drafts will appear when done.</p>
      )}
    </div>
  );
}
