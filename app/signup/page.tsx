"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-generate slug from studio name (preferred) or first+last name
  useEffect(() => {
    if (slugManuallyEdited) return;
    const suggested = studioName.trim()
      ? toSlug(studioName)
      : toSlug(`${firstName} ${lastName}`);
    setSlug(suggested);
  }, [firstName, lastName, studioName, slugManuallyEdited]);

  const checkSlug = useCallback((value: string) => {
    if (!value) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(value)}`);
        const json = await res.json();
        setSlugStatus(json.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
  }, []);

  useEffect(() => {
    checkSlug(slug);
  }, [slug, checkSlug]);

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
    setSlug(cleaned);
    setSlugManuallyEdited(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (slugStatus === "taken") {
      setError("That URL is already taken — please choose a different one.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    // Inject the current slug value (controlled input may differ from DOM)
    formData.set("slug", slug);

    const result = await signUp(formData);
    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
    }
  }

  const siteBase = "ceramicsgallery.co.uk/";

  const slugHint = () => {
    if (!slug) return null;
    if (slugStatus === "checking") return <span className="text-stone-400">Checking…</span>;
    if (slugStatus === "available") return <span className="text-green-600">✓ Available</span>;
    if (slugStatus === "taken") return <span className="text-red-600">✗ Already taken</span>;
    return null;
  };

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-clay-900">
          Join Ceramics Gallery
        </h1>
        <p className="mt-2 text-stone-600">
          Create your potter account in seconds.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-stone-700 mb-1">
                Your first name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="input-field"
                placeholder="e.g. Sarah"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-stone-700 mb-1">
                Your last name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="input-field"
                placeholder="e.g. Hughes"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="studio_name" className="block text-sm font-medium text-stone-700 mb-1">
              Studio name <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              id="studio_name"
              name="studio_name"
              type="text"
              className="input-field"
              placeholder="e.g. Mudlark Studio"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-stone-700 mb-1">
              Your Ceramics Gallery URL
            </label>
            <div className="flex items-center rounded-lg border border-stone-300 bg-white focus-within:border-clay-500 focus-within:ring-1 focus-within:ring-clay-500 overflow-hidden">
              <span className="pl-3 pr-1 text-sm text-stone-400 whitespace-nowrap select-none">
                {siteBase}
              </span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none text-stone-900"
                placeholder="your-name"
                value={slug}
                onChange={handleSlugChange}
              />
            </div>
            <p className="mt-1 text-xs min-h-[1.25rem]">{slugHint()}</p>
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
              placeholder="Tell us about your practice, influences, and the type of work you make…"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={slugStatus === "taken"}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
