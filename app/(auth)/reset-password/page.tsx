"use client";

import { useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await updatePassword(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-clay-800 block mb-8 text-center">
          Ceramics Gallery
        </Link>
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-6">Choose a new password</h1>

        <form onSubmit={handleSubmit} method="POST" className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}{" "}
              {error.includes("expired") && (
                <Link href="/forgot-password" className="underline font-medium">Request a new link</Link>
              )}
            </p>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">New password</label>
            <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className="input-field" placeholder="At least 6 characters" />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">Confirm new password</label>
            <input id="confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
