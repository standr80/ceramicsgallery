"use client";

import { useState } from "react";

type ScoutType = "profile" | "shop" | "courses";

interface TriggerScoutButtonProps {
  potterId: string;
  scoutType: ScoutType;
  label: string;
  hasUrl: boolean;
  missingUrlMessage: string;
}

export function TriggerScoutButton({
  potterId,
  scoutType,
  label,
  hasUrl,
  missingUrlMessage,
}: TriggerScoutButtonProps) {
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (!hasUrl) {
      setMessage(missingUrlMessage);
      setStatus("error");
      return;
    }
    setStatus("starting");
    setMessage("");

    try {
      const res = await fetch("/api/agents/trigger-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potterId, scoutType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("running");
        setMessage(
          scoutType === "profile"
            ? "Profile scout running. Biography will update in ~30 seconds."
            : scoutType === "shop"
            ? "Shop scout running. Check Drafts in ~30 seconds."
            : "Courses scout running. Check Drafts in ~30 seconds."
        );
      }
    } catch {
      setMessage("Network error — please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={status === "starting" || status === "running"}
        className="inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
      >
        {status === "starting" ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
            Starting…
          </>
        ) : (
          label
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
