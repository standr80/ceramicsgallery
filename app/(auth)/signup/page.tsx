"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

function toSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(displayName));
  }, [displayName, slugEdited]);

  const checkSlug = useCallback((value: string) => {
    if (!value) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(value)}`);
        const json = await res.json();
        setSlugStatus(json.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 400);
  }, []);

  useEffect(() => { checkSlug(slug); }, [slug, checkSlug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (slugStatus === "taken") { setError("That URL is taken — please choose another."); return; }
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("slug", slug);
    const result = await signUp(fd);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-clay-800 block mb-8 text-center">
          Ceramics Gallery
        </Link>
        <h1 className="font-display text-3xl font-semibold text-clay-900 mb-2">Join as a potter</h1>
        <p className="text-stone-500 mb-6">List your work and take payments in minutes.</p>

        <form onSubmit={handleSubmit} method="POST" className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium mb-1.5">Your name</label>
            <input id="display_name" name="display_name" type="text" required className="input-field"
              placeholder="e.g. Sarah Hughes" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div>
            <label htmlFor="studio_name" className="block text-sm font-medium mb-1.5">
              Studio name <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input id="studio_name" name="studio_name" type="text" className="input-field" placeholder="e.g. Mudlark Studio" />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-1.5">Your gallery URL</label>
            <div className="flex items-center rounded-xl border border-stone-300 bg-white focus-within:border-clay-500 focus-within:ring-2 focus-within:ring-clay-500/20 overflow-hidden">
              <span className="pl-3 pr-1 text-sm text-stone-400 whitespace-nowrap select-none">ceramicsgallery.co.uk/</span>
              <input id="slug" name="slug" type="text" required className="flex-1 py-2.5 pr-3 text-sm bg-transparent outline-none"
                value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setSlugEdited(true); }} />
            </div>
            <p className="mt-1 text-xs min-h-4">
              {slugStatus === "checking" && <span className="text-stone-400">Checking…</span>}
              {slugStatus === "available" && <span className="text-green-600">✓ Available</span>}
              {slugStatus === "taken" && <span className="text-red-600">✗ Already taken</span>}
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
            <input id="email" name="email" type="email" required className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
            <input id="password" name="password" type="password" required minLength={6} className="input-field" placeholder="At least 6 characters" />
          </div>

          <button type="submit" disabled={loading || slugStatus === "taken"} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-stone-500 text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-clay-700 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
