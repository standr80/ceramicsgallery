"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "product";
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to add a product." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id, slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const descriptionExtended = (formData.get("descriptionExtended") as string) || null;
  const priceStr = formData.get("price") as string;
  const category = (formData.get("category") as string) || null;
  const featured = formData.get("featured") === "true";
  const sku = (formData.get("sku") as string)?.trim() || null;
  const imagesJson = formData.get("images") as string;

  if (!name?.trim() || !description?.trim() || !priceStr) {
    return { error: "Name, description and price are required." };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price < 0) {
    return { error: "Please enter a valid price." };
  }

  let images: string[] = [];
  if (imagesJson) {
    try {
      images = JSON.parse(imagesJson) as string[];
    } catch {
      images = [];
    }
  }
  const image = images[0] || "/images/placeholder.svg";
  if (images.length === 0) {
    images = [image];
  }

  let baseSlug = slugFromTitle(name);
  let slug = baseSlug;
  let attempt = 0;
  for (;;) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("potter_id", potter.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const { error } = await supabase.from("products").insert({
    potter_id: potter.id,
    slug,
    name: name.trim(),
    description: description.trim(),
    description_extended: descriptionExtended?.trim() || null,
    price,
    currency: "GBP",
    image,
    images,
    featured,
    category: category || null,
    sku,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to edit a product." };

  const { data: potter } = await supabase
    .from("potters")
    .select("id, slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) return { error: "Potter profile not found." };

  const { data: product } = await supabase
    .from("products")
    .select("id, slug")
    .eq("id", productId)
    .eq("potter_id", potter.id)
    .single();

  if (!product) return { error: "Product not found or you don't have permission to edit it." };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const descriptionExtended = (formData.get("descriptionExtended") as string) || null;
  const priceStr = formData.get("price") as string;
  const category = (formData.get("category") as string) || null;
  const featured = formData.get("featured") === "true";
  const sku = (formData.get("sku") as string)?.trim() || null;
  const imagesJson = formData.get("images") as string;

  if (!name?.trim() || !description?.trim() || !priceStr) {
    return { error: "Name, description and price are required." };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price < 0) {
    return { error: "Please enter a valid price." };
  }

  let images: string[] = [];
  if (imagesJson) {
    try {
      images = JSON.parse(imagesJson) as string[];
    } catch {
      images = [];
    }
  }
  const image = images[0] || "/images/placeholder.svg";
  if (images.length === 0) {
    images = [image];
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: name.trim(),
      description: description.trim(),
      description_extended: descriptionExtended?.trim() || null,
      price,
      category: category || null,
      image,
      images,
      featured,
      sku: sku || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("potter_id", potter.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/${potter.slug}`);
  revalidatePath(`/${potter.slug}/${product.slug}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/products/${productId}`);
  return { success: true };
}
