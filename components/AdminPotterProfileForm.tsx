"use client";

import { useState, useRef } from "react";
import { updatePotterProfileAdmin } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";

interface AdminPotterProfileFormProps {
  potterId: string;
  initialName: string;
  initialSlug: string;
  initialBiography: string;
  initialWebsite: string | null;
  initialImage: string | null;
  initialActive: boolean;
}

export function AdminPotterProfileForm({
  potterId,
  initialName,
  initialSlug,
  initialBiography,
  initialWebsite,
  initialImage,
  initialActive,
}: AdminPotterProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `potters/${potterId}-${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      setImageUrl(data.publicUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  function removeImage() {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    if (imageUrl) formData.set("image", imageUrl);

    const result = await updatePotterProfileAdmin(potterId, formData);

    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
      return;
    }

    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Profile updated successfully.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Profile photo
        </label>
        <div className="flex items-start gap-4">
          {imageUrl && (
            <div className="relative shrink-0">
              <img
                src={imageUrl}
                alt="Profile"
                className="h-24 w-24 rounded-lg object-cover border border-clay-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-1 -right-1 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block text-sm text-stone-600 file:mr-4 file:rounded file:border-0 file:bg-clay-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-clay-700 hover:file:bg-clay-200"
            />
            {uploading && <p className="mt-1 text-sm text-stone-500">Uploading…</p>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Name *
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="input-field"
          placeholder="Potter name or studio name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          URL slug
        </label>
        <input
          name="slug"
          type="text"
          defaultValue={initialSlug}
          className="input-field font-mono text-sm"
          placeholder="e.g. richard-standen"
        />
        <p className="mt-1 text-xs text-stone-500">Used in URLs: /slug</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Biography *
        </label>
        <textarea
          name="biography"
          rows={6}
          required
          defaultValue={initialBiography}
          className="input-field resize-y"
          placeholder="Tell visitors about this potter..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Website (optional)
        </label>
        <input
          name="website"
          type="url"
          defaultValue={initialWebsite || ""}
          className="input-field"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={initialActive}
          className="h-4 w-4 rounded border-stone-300 text-clay-600 focus:ring-clay-500"
        />
        <label htmlFor="active" className="text-sm font-medium text-stone-700">
          Active (visible in catalog)
        </label>
      </div>

      <button type="submit" className="btn-primary">
        Save profile
      </button>
    </form>
  );
}
