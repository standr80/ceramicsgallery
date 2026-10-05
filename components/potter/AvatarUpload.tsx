"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/utils/images";

export function AvatarUpload({ initialPath }: { initialPath: string | null }) {
  const [path, setPath] = useState(initialPath ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const newPath = `avatars/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await createClient().storage.from("piece-images").upload(newPath, file);
    setUploading(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setPath(newPath);
  }

  return (
    <div className="flex items-center gap-5">
      <input type="hidden" name="avatar_path" value={path} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
        className="w-24 h-24 rounded-full overflow-hidden bg-clay-100 border-2 border-dashed border-clay-200 hover:border-clay-400 transition-colors flex items-center justify-center shrink-0"
        aria-label="Upload photo"
      >
        {path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getPublicImageUrl(path)} alt="Your photo" className="w-full h-full object-cover" />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A4527" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13.5" r="3.5" />
          </svg>
        )}
      </button>
      <div className="text-sm">
        <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-clay-700 underline underline-offset-2">
          {uploading ? "Uploading…" : path ? "Change photo" : "Upload a photo"}
        </button>
        {path && !uploading && (
          <button type="button" onClick={() => setPath("")} className="ml-3 text-stone-400 hover:text-stone-700">
            Remove
          </button>
        )}
        <p className="text-stone-400 mt-1">You, your studio or your work. Click Save profile to keep it.</p>
        {error && <p className="text-red-600 mt-1">{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
    </div>
  );
}
