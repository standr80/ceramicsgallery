"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { attachImages, deletePieceImage } from "@/app/actions/pieces";
import { getPublicImageUrl } from "@/lib/utils/images";
import type { Piece, PieceImage } from "@/types/database";

const CATEGORIES = ["vase", "bowl", "mug", "plate", "jar", "teapot", "sculpture", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  vase: "Vase", bowl: "Bowl", mug: "Mug", plate: "Plate",
  jar: "Jar", teapot: "Teapot", sculpture: "Sculpture", other: "Other",
};

type PieceWithCategory = Piece & { category_slug: string | null };

interface Props {
  piece: PieceWithCategory;
  images: PieceImage[];
  stripeConnected: boolean;
  onUpdate: (fd: FormData) => Promise<void>;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function PieceEditForm({ piece, images: initialImages, stripeConnected, onUpdate, onPublish, onUnpublish, onDelete }: Props) {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved") === "1";

  const [images, setImages] = useState<PieceImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Clear saved banner after 3s
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      window.history.replaceState({}, "", url.toString());
    }, 3000);
    return () => clearTimeout(t);
  }, [saved]);

  async function handleImageUpload(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    const slots = 3 - images.length;
    if (slots <= 0) return;
    const files = Array.from(incoming).slice(0, slots);

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const tempPaths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `temp/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("piece-images").upload(path, file);
        if (error) throw new Error(error.message);
        tempPaths.push(path);
      }
      const result = await attachImages(piece.id, tempPaths, images.length);
      if (result && "error" in result) throw new Error(result.error);
      // Reload images from server by refreshing
      window.location.reload();
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    setDeleting(imageId);
    try {
      await deletePieceImage(imageId, piece.id);
      setImages((imgs) => imgs.filter((i) => i.id !== imageId));
    } finally {
      setDeleting(null);
    }
  }

  const isLive = piece.status === "live";
  const accent = "#9A4527";

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <a href="/dashboard/studio" className="text-stone-400 hover:text-stone-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </a>
        <h1 className="font-display text-3xl font-semibold text-clay-900 flex-1 truncate">{piece.title}</h1>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
          isLive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
        }`}>
          {isLive ? "Live" : "Draft"}
        </span>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          Changes saved.
        </div>
      )}

      {/* Images */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-3">Photos <span className="text-stone-400 font-normal">({images.length}/3)</span></p>
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => {
            const url = getPublicImageUrl(img.processed_path ?? img.original_path);
            return (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-clay-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={img.alt_text ?? piece.title} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={deleting === img.id}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-50"
                  aria-label="Remove photo"
                >
                  {deleting === img.id ? "…" : "✕"}
                </button>
              </div>
            );
          })}
          {images.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files); }}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-clay-200 flex flex-col items-center justify-center gap-1 hover:border-clay-400 transition-colors disabled:opacity-50 text-clay-300"
            >
              {uploading ? (
                <span className="text-xs text-stone-400">Uploading…</span>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13.5" r="3.5" />
                  </svg>
                  <span className="text-xs text-stone-400">Add photo</span>
                </>
              )}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleImageUpload(e.target.files)} />
        {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
      </div>

      {/* Edit form */}
      <form action={onUpdate} className="flex flex-col gap-5">
        <input type="hidden" name="piece_id" value={piece.id} />
        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-1.5">Title</label>
          <input id="title" name="title" type="text" required defaultValue={piece.title} className="input-field" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-1.5">Description</label>
          <textarea id="description" name="description" rows={4} defaultValue={piece.description ?? ""} className="input-field resize-y" />
        </div>
        <div>
          <label htmlFor="glaze_notes" className="block text-sm font-semibold mb-1.5">Clay, glaze and firing</label>
          <input id="glaze_notes" name="glaze_notes" type="text" defaultValue={piece.glaze_notes ?? ""} className="input-field" />
        </div>

        <div>
          <p className="block text-sm font-semibold mb-2">Type</p>
          <CategoryPicker defaultValue={piece.category_slug ?? "vase"} />
        </div>

        <div className="card p-4 flex flex-col gap-4">
          <p className="text-sm font-semibold">Measurements and price</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="height_cm" className="block text-xs text-stone-500 mb-1.5">Height (cm)</label>
              <input id="height_cm" name="height_cm" type="number" inputMode="decimal" defaultValue={piece.height_cm ?? ""} className="input-field" />
            </div>
            <div>
              <label htmlFor="width_cm" className="block text-xs text-stone-500 mb-1.5">Width (cm)</label>
              <input id="width_cm" name="width_cm" type="number" inputMode="decimal" defaultValue={piece.width_cm ?? ""} className="input-field" />
            </div>
          </div>
          <div>
            <label htmlFor="price" className="block text-xs text-stone-500 mb-1.5">Price (£)</label>
            <input
              id="price"
              name="price_pence"
              type="number"
              inputMode="decimal"
              defaultValue={piece.price_pence != null ? (piece.price_pence / 100).toFixed(2) : ""}
              className="input-field text-lg font-semibold"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="collection_available" value="true" defaultChecked={piece.collection_available} className="w-4 h-4 accent-clay-600" />
            Buyers can collect from my studio
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary">Save changes</button>
        </div>
      </form>

      {/* Publish / unpublish */}
      <div className="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-3">
        {!isLive && (
          stripeConnected ? (
            <form action={onPublish}>
              <button
                type="submit"
                className="btn-primary w-full"
                onClick={() => setActionPending(true)}
              >
                {actionPending ? "Publishing…" : "Publish this pot"}
              </button>
            </form>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-amber-900">Connect Stripe to publish</p>
              <p className="text-sm text-amber-800 mt-0.5">Your pot is saved as a draft. Connect your payment account first.</p>
              <a href="/dashboard/connect-stripe" className="inline-block mt-2 text-sm font-medium text-clay-700 underline">Set up payments →</a>
            </div>
          )
        )}
        {isLive && (
          <form action={onUnpublish}>
            <button type="submit" className="btn-ghost w-full text-stone-600">Unpublish (move back to draft)</button>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 pt-8 border-t border-stone-100">
        {confirmDelete ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-red-800">Delete this pot?</p>
            <p className="text-sm text-red-700">This can't be undone. All photos will also be removed.</p>
            <div className="flex gap-2">
              <form action={onDelete}>
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                  Yes, delete it
                </button>
              </form>
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Delete this pot…
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryPicker({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name="category_slug" value={value} />
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setValue(cat)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            value === cat
              ? "bg-clay-600 border-clay-600 text-white"
              : "bg-white border-stone-200 text-stone-700 hover:border-clay-300"
          }`}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
