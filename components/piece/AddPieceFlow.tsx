"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPiece, publishPiece } from "@/app/actions/pieces";

type Screen = "photos" | "drafting" | "review" | "live";

const CATEGORIES = ["vase", "bowl", "mug", "plate", "jar", "teapot", "sculpture", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  vase: "Vase", bowl: "Bowl", mug: "Mug", plate: "Plate",
  jar: "Jar", teapot: "Teapot", sculpture: "Sculpture", other: "Other",
};

interface Draft {
  title: string;
  description: string;
  glaze_notes: string;
  category: string;
  height: string;
  width: string;
  price: string;
  collection: boolean;
  pieceId: string | null;
  priceLow: number | null;
  priceHigh: number | null;
}

const emptyDraft = (): Draft => ({
  title: "", description: "", glaze_notes: "", category: "vase",
  height: "", width: "", price: "", collection: true, pieceId: null,
  priceLow: null, priceHigh: null,
});

export function AddPieceFlow({ onDone }: { onDone: () => void }) {
  const [screen, setScreen] = useState<Screen>("photos");
  const [files, setFiles] = useState<File[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accent = "#9A4527";

  async function handleContinue() {
    if (files.length === 0) return;
    setScreen("drafting");
    setError(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `temp/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("piece-images")
          .upload(path, file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: { publicUrl } } = supabase.storage
          .from("piece-images")
          .getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }

      const res = await fetch("/api/pieces/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: uploadedUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Draft failed.");

      setDraft((d) => ({
        ...d,
        title: data.title ?? "",
        description: data.description ?? "",
        glaze_notes: data.glaze_notes ?? "",
        category: data.category ?? "vase",
        priceLow: data.ai_price_low_pence ?? null,
        priceHigh: data.ai_price_high_pence ?? null,
      }));
      setScreen("review");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setScreen("photos");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("title", draft.title);
      fd.set("description", draft.description);
      fd.set("glaze_notes", draft.glaze_notes);
      fd.set("price_pence", draft.price ? String(Math.round(parseFloat(draft.price) * 100)) : "");
      fd.set("height_cm", draft.height);
      fd.set("width_cm", draft.width);
      fd.set("collection_available", String(draft.collection));

      const result = await createPiece(fd);
      if ("error" in result) throw new Error(result.error);
      await publishPiece(result.id);

      setDraft((d) => ({ ...d, pieceId: result.id }));
      setScreen("live");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setPublishing(false);
    }
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)].slice(0, 3);
    setFiles(next);
  }

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  if (screen === "photos") return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Snap your pot</h2>
        <p className="text-stone-500 mt-1">Up to three photos. Any background — we tidy it up for you.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full h-64 border-2 border-dashed border-clay-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-clay-400 transition-colors cursor-pointer bg-white"
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13.5" r="3.5" />
        </svg>
        <span className="text-lg font-semibold">Tap to add photos</span>
        <span className="text-sm text-stone-400">or drag and drop</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => addFiles(e.target.files)} />

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-clay-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                aria-label="Remove"
              >✕</button>
            </div>
          ))}
          {files.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-clay-200 flex items-center justify-center text-2xl text-clay-300 hover:border-clay-400 transition-colors"
            >+</button>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={files.length === 0}
        onClick={handleContinue}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );

  if (screen === "drafting") return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-clay-100 flex items-center justify-center animate-pulse">
        <svg width="48" height="60" viewBox="0 0 64 80" aria-hidden="true">
          <path d="M24 6h16v6c0 4 12 10 12 30 0 18-9 32-20 32S12 60 12 42c0-20 12-26 12-30z" fill={accent} />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-semibold">Writing your listing…</h2>
      <div className="flex flex-col gap-2 text-stone-500">
        <p>Reading the glaze and form</p>
        <p>Looking at similar pieces</p>
        <p>Drafting your description</p>
      </div>
    </div>
  );

  if (screen === "review") return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Check and publish</h2>
        <p className="text-stone-500 mt-1">We drafted this from your photos. Change anything that isn't right.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Title</label>
          <input type="text" value={draft.title} onChange={set("title")} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Description</label>
          <textarea rows={4} value={draft.description} onChange={set("description")} className="input-field resize-y" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Clay, glaze and firing</label>
          <input type="text" value={draft.glaze_notes} onChange={set("glaze_notes")} className="input-field" />
        </div>

        <div>
          <p className="block text-sm font-semibold mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const on = draft.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, category: cat }))}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    on ? "bg-clay-600 border-clay-600 text-white" : "bg-white border-stone-200 text-stone-700 hover:border-clay-300"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-4">
          <p className="text-sm font-semibold">Only you know these</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Height (cm)</label>
              <input type="number" inputMode="decimal" value={draft.height} onChange={set("height")} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Width (cm)</label>
              <input type="number" inputMode="decimal" value={draft.width} onChange={set("width")} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">Price (£)</label>
            <input type="number" inputMode="decimal" value={draft.price} onChange={set("price")} className="input-field text-lg font-semibold" placeholder="0.00" />
            {draft.priceLow != null && draft.priceHigh != null && (
              <p className="text-xs text-stone-400 mt-1">
                Similar pieces: £{(draft.priceLow / 100).toFixed(0)}–£{(draft.priceHigh / 100).toFixed(0)}
              </p>
            )}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={draft.collection} onChange={(e) => setDraft((d) => ({ ...d, collection: e.target.checked }))} className="w-4 h-4 accent-clay-600" />
            Buyers can collect from my studio
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing || !draft.title}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {publishing ? "Publishing…" : "Publish"}
      </button>
      <button type="button" onClick={() => setScreen("photos")} className="btn-ghost w-full">← Back to photos</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 py-8 text-center items-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2F5E3A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <div>
        <h2 className="font-display text-3xl font-semibold">It's live</h2>
        <p className="text-stone-500 mt-2">{draft.title} is now for sale on the gallery.</p>
      </div>
      <button type="button" onClick={onDone} className="btn-primary">Back to your pots</button>
    </div>
  );
}
