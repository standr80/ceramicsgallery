"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await signUp(formData);
    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
    }
  }

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-clay-900">
          Join as a potter
        </h1>
        <p className="mt-2 text-stone-600">
          Create an account to list your work on Ceramics Gallery and add products.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
              Your name / studio name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input-field"
              placeholder="e.g. Fred Bloggs"
            />
          </div>
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
              minLength={6}
              className="input-field"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label htmlFor="biography" className="block text-sm font-medium text-stone-700 mb-1">
              Short biography
            </label>
            <textarea
              id="biography"
              name="biography"
              rows={4}
              required
              className="input-field resize-y"
              placeholder="Tell us about your practice, influences, and the type of work you make..."
            />
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-stone-700 mb-0.5">Your website URLs</p>
              <p className="text-xs text-stone-500">
                Providing these lets our AI scout automatically import your products, courses, and biography.
                All fields are optional.
              </p>
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-stone-700 mb-1">
                Main website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                className="input-field"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <label htmlFor="website_about" className="block text-sm font-medium text-stone-700 mb-1">
                About / bio page
              </label>
              <input
                id="website_about"
                name="website_about"
                type="url"
                className="input-field"
                placeholder="https://yourwebsite.com/about"
              />
            </div>
            <div>
              <label htmlFor="website_shop" className="block text-sm font-medium text-stone-700 mb-1">
                Shop / products page
              </label>
              <input
                id="website_shop"
                name="website_shop"
                type="url"
                className="input-field"
                placeholder="https://yourwebsite.com/shop"
              />
            </div>
            <div>
              <label htmlFor="website_courses" className="block text-sm font-medium text-stone-700 mb-1">
                Courses / workshops page
              </label>
              <input
                id="website_courses"
                name="website_courses"
                type="url"
                className="input-field"
                placeholder="https://yourwebsite.com/courses"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button type="submit" className="btn-primary">
              Create account
            </button>
            <Link href="/login" className="btn-secondary">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
