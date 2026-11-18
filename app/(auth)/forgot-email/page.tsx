"use client";

import { useState } from "react";
import Link from "next/link";
import { findAccountEmail } from "@/app/actions/auth";

type Match = { name: string; slug: string; email: string | null };

export default function ForgotEmailPage() {
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMatches(null);
    setLoading(true);
    const result = await findAccountEmail(new FormData(e.currentTarget));
    setLoading(false);
    if ("error" in result && result.error) setError(result.error);
    else if ("matches" in result) setMatches(result.matches ?? []);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-clay-800 block mb-8 text-center">
          Ceramics Gallery
        </Link>
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-2">Find your sign-in email</h1>
        <p className="text-stone-500 mb-6">
          Enter your page address (e.g. ceramicsgallery.co.uk/your-name), your name or your studio name. We&apos;ll show a hint of the email you signed up with.
        </p>

        <form onSubmit={handleSubmit} method="POST" className="flex flex-col gap-4">
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
          <div>
            <label htmlFor="query" className="block text-sm font-medium mb-1.5">Page address, name or studio</label>
            <input id="query" name="query" type="text" required className="input-field" placeholder="ceramicsgallery.co.uk/your-name" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
            {loading ? "Searching…" : "Find my email"}
          </button>
        </form>

        {matches && (
          <div className="mt-6" aria-live="polite">
            {matches.length === 0 ? (
              <p className="text-sm text-stone-600 bg-stone-100 rounded-xl px-4 py-3">
                We couldn&apos;t find an account matching that. Try your page address exactly as it appears in the link to your page.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {matches.map((m) => (
                  <li key={m.slug} className="card p-4">
                    <p className="text-sm text-stone-500">{m.name} · /{m.slug}</p>
                    <p className="font-semibold text-stone-900 mt-1 tracking-wide">{m.email}</p>
                  </li>
                ))}
              </ul>
            )}
            {matches.length > 0 && (
              <p className="text-sm text-stone-500 mt-4">
                Recognise it?{" "}
                <Link href="/login" className="text-clay-700 font-medium hover:underline">Sign in</Link>
                {" "}or{" "}
                <Link href="/forgot-password" className="text-clay-700 font-medium hover:underline">reset your password</Link>.
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-stone-500 text-center mt-6">
          <Link href="/login" className="hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
