"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-clay-800 block mb-8 text-center">
          Ceramics Gallery
        </Link>
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-6">Sign in</h1>

        <form onSubmit={handleSubmit} method="POST" className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
            <input id="email" name="email" type="email" required className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
            <input id="password" name="password" type="password" required className="input-field" placeholder="Your password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-stone-500 text-center mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-clay-700 font-medium hover:underline">Join as a potter</Link>
        </p>
      </div>
    </div>
  );
}
