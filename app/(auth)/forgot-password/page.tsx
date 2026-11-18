"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const expired = useSearchParams().get("expired") === "1";
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestPasswordReset(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) setError(result.error);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-clay-800 block mb-8 text-center">
          Ceramics Gallery
        </Link>
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-2">Reset your password</h1>

        {sent ? (
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              If there&apos;s an account with that email, we&apos;ve sent a link to reset your password. Check your inbox and spam folder.
            </p>
            <p className="text-sm text-stone-500">
              Open the link on this device and in this browser. It expires after an hour.
            </p>
          </div>
        ) : (
          <>
            <p className="text-stone-500 mb-6">Enter the email you signed up with and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} method="POST" className="flex flex-col gap-4">
              {expired && !error && (
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  That reset link has expired or was opened in a different browser. Please request a new one.
                </p>
              )}
              {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                <input id="email" name="email" type="email" required autoComplete="email" className="input-field" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <div className="text-sm text-stone-500 text-center mt-6 flex flex-col gap-2">
          <Link href="/forgot-email" className="text-clay-700 font-medium hover:underline">Can&apos;t remember which email you used?</Link>
          <Link href="/login" className="hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
