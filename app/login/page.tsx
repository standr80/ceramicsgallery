"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await signIn(formData);
    if (result && "error" in result) {
      setError(result.error);
      return;
    }
    if (result?.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-clay-900">
          Potter login
        </h1>
        <p className="mt-2 text-stone-600">
          Sign in to manage your products and profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="Your password"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <button type="submit" className="btn-primary">
              Log in
            </button>
            <Link href="/signup" className="btn-secondary">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
