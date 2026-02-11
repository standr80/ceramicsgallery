"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProduct } from "@/app/actions/products";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface EditProductFormProps {
  productId: string;
  initialName: string;
  initialDescription: string;
  initialDescriptionExtended: string | null;
  initialPrice: number;
  initialCategory: string | null;
  initialFeatured: boolean;
  initialSku: string | null;
  initialImages: string[];
}

export function EditProductForm({
  productId,
  initialName,
  initialDescription,
  initialDescriptionExtended,
  initialPrice,
  initialCategory,
  initialFeatured,
  initialSku,
  initialImages,
}: EditProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialImages.length > 0 ? initialImages : ["/images/placeholder.svg"]
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const supabase = createClient();
    const buffer: string[] = [...imageUrls];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${i}.${ext}`;

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
        buffer.push(data.publicUrl);
      }
      setImageUrls(buffer);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("images", JSON.stringify(imageUrls));

    const result = await updateProduct(productId, formData);

    if (result && "error" in result) {
      setError(result.error ?? "An error occurred");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-6 text-green-800">
        <p className="font-medium">Product updated successfully.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-800">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Product name *
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="input-field"
          placeholder="e.g. Large Stoneware Bowl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          rows={3}
          required
          defaultValue={initialDescription}
          className="input-field resize-y"
          placeholder="Short description for listings..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Extended description (optional)
        </label>
        <textarea
          name="descriptionExtended"
          rows={4}
          defaultValue={initialDescriptionExtended || ""}
          className="input-field resize-y"
          placeholder="Full description for the product page..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Price (GBP) *
        </label>
        <input
          name="price"
          type="number"
          required
          min="0"
          step="0.01"
          defaultValue={initialPrice}
          className="input-field w-32"
          placeholder="95.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Category
        </label>
        <select name="category" className="input-field w-full max-w-xs" defaultValue={initialCategory || ""}>
          <option value="">— Select —</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Images
        </label>
        <p className="text-xs text-stone-500 mb-2">
          First image is the main product image. Upload more or remove existing.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-stone-600 file:mr-4 file:rounded file:border-0 file:bg-clay-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-clay-700 hover:file:bg-clay-200"
        />
        {uploading && <p className="mt-2 text-sm text-stone-500">Uploading…</p>}
        {imageUrls.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {imageUrls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative aspect-square w-20 overflow-hidden rounded-lg border border-clay-200"
              >
                <img
                  src={url}
                  alt={`Image ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Featured on home page
        </label>
        <select name="featured" className="input-field w-32" defaultValue={initialFeatured ? "true" : "false"}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          SKU (optional)
        </label>
        <input
          name="sku"
          type="text"
          defaultValue={initialSku || ""}
          className="input-field w-40"
          placeholder="e.g. FB-BOWL-01"
        />
      </div>

      <div className="flex gap-4">
        <button type="submit" className="btn-primary">
          Save changes
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
