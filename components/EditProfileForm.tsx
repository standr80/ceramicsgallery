"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { updateProfile } from "@/app/actions/potter";
import { changePassword } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

interface EditProfileFormProps {
  initialName: string;
  initialBiography: string;
  initialImage: string | null;
  initialSlug: string;
  initialEmail: string;
  potterId: string;
}

export function EditProfileForm({
  initialName,
  initialBiography,
  initialImage,
  initialSlug,
  initialEmail,
  potterId,
}: EditProfileFormProps) {
  // ── Profile state ──────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Slug state ─────────────────────────────────────
  const [slug, setSlug] = useState(initialSlug);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "unchanged">("unchanged");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlug = useCallback((value: string) => {
    if (!value || value === initialSlug) { setSlugStatus("unchanged"); return; }
    setSlugStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(value)}`);
        const json = await res.json();
        setSlugStatus(json.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 400);
  }, [initialSlug]);

  useEffect(() => { checkSlug(slug); }, [slug, checkSlug]);

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
    setSlug(cleaned);
  }

  // ── Password state ─────────────────────────────────
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const pwFormRef = useRef<HTMLFormElement>(null);

  // ── Image upload ───────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `potters/${potterId}-${Date.now()}.${ext}`;
    try {
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (uploadError) { setError(`Upload failed: ${uploadError.message}`); setUploading(false); return; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  function removeImage() {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Profile submit ─────────────────────────────────
  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (slugStatus === "taken") { setError("That URL is already taken — please choose a different one."); return; }
    const formData = new FormData(e.currentTarget);
    if (imageUrl) formData.set("image", imageUrl);
    formData.set("slug", slug);
    const result = await updateProfile(formData);
    if (result && "error" in result) { setError(result.error ?? "An error occurred"); return; }
    setSuccess(true);
  }

  // ── Password submit ────────────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;
    if (password !== confirm) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    const result = await changePassword(formData);
    setPwSaving(false);
    if (result && "error" in result) { setPwError(result.error ?? "An error occurred"); return; }
    setPwSuccess(true);
    pwFormRef.current?.reset();
  }

  const slugHint = () => {
    if (slugStatus === "unchanged") return null;
    if (slugStatus === "checking") return <span className="text-stone-400">Checking…</span>;
    if (slugStatus === "available") return <span className="text-green-600">✓ Available</span>;
    if (slugStatus === "taken") return <span className="text-red-600">✗ Already taken</span>;
    return null;
  };

  return (
    <div className="space-y-10 max-w-2xl">

      {/* ── Profile details ───────────────────────── */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Profile details</h3>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Profile updated successfully.</p>}

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Profile photo</label>
          <div className="flex items-start gap-4">
            {imageUrl && (
              <div className="relative shrink-0">
                <img src={imageUrl} alt="Profile" className="h-24 w-24 rounded-lg object-cover border border-clay-200" />
                <button type="button" onClick={removeImage} className="absolute -top-1 -right-1 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700">Remove</button>
              </div>
            )}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading}
                className="block text-sm text-stone-600 file:mr-4 file:rounded file:border-0 file:bg-clay-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-clay-700 hover:file:bg-clay-200" />
              {uploading && <p className="mt-1 text-sm text-stone-500">Uploading…</p>}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Display name *</label>
          <input name="name" type="text" required defaultValue={initialName} className="input-field" placeholder="Your name or studio name" />
          <p className="mt-1 text-xs text-stone-400">Your studio name, or first and last name.</p>
        </div>

        {/* Ceramics Gallery URL */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Your Ceramics Gallery URL</label>
          <div className="flex items-center rounded-lg border border-stone-300 bg-white focus-within:border-clay-500 focus-within:ring-1 focus-within:ring-clay-500 overflow-hidden">
            <span className="pl-3 pr-1 text-sm text-stone-400 whitespace-nowrap select-none">ceramicsgallery.co.uk/</span>
            <input
              type="text"
              required
              className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none text-stone-900"
              value={slug}
              onChange={handleSlugChange}
            />
          </div>
          <p className="mt-1 text-xs min-h-[1.25rem]">{slugHint()}</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input name="email" type="email" required defaultValue={initialEmail} className="input-field" placeholder="you@example.com" />
          <p className="mt-1 text-xs text-stone-400">A confirmation will be sent to the new address before it takes effect.</p>
        </div>

        {/* Biography */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Biography *</label>
          <textarea name="biography" rows={6} required defaultValue={initialBiography} className="input-field resize-y" placeholder="Tell visitors about your practice..." />
        </div>

        <button type="submit" disabled={slugStatus === "taken"} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          Save profile
        </button>
      </form>

      {/* ── Change password ───────────────────────── */}
      <form ref={pwFormRef} onSubmit={handlePasswordSubmit} className="space-y-5 pt-8 border-t border-stone-200">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Change password</h3>

        {pwError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pwError}</p>}
        {pwSuccess && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Password updated successfully.</p>}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">New password</label>
          <input name="password" type="password" required minLength={6} className="input-field" placeholder="At least 6 characters" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Confirm new password</label>
          <input name="confirm_password" type="password" required minLength={6} className="input-field" placeholder="Repeat new password" />
        </div>

        <button type="submit" disabled={pwSaving} className="btn-primary disabled:opacity-50">
          {pwSaving ? "Updating…" : "Update password"}
        </button>
      </form>

    </div>
  );
}
