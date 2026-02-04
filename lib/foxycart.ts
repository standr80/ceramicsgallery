import type { Product, Potter } from "@/types";

/** Foxycart store domain from your loader.js (cdn.foxycart.com/STORE_ID/loader.js) */
const FOXYCART_STORE_DOMAIN = "cen292lch17dcn5b";
const FOXYCART_CART_BASE = `https://${FOXYCART_STORE_DOMAIN}.foxycart.com/cart`;

/** Base URL for product page links (used for Foxycart url param) */
const SITE_BASE =
  typeof process.env.NEXT_PUBLIC_SITE_URL !== "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.ceramicsgallery.co.uk";

/**
 * Build the full URL for a product image (Foxycart expects absolute URLs).
 */
function fullImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const base = SITE_BASE.replace(/\/$/, "");
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${base}${path}`;
}

/**
 * Build a Foxycart add-to-cart URL for a product.
 * Uses name, price, code (SKU), image, and url (product page) per Foxycart docs.
 */
export function buildAddToCartUrl(product: Product, potter?: Potter): string {
  const params = new URLSearchParams();
  params.set("name", product.name);
  params.set("price", product.price.toFixed(2));
  if (product.sku) {
    params.set("code", product.sku);
  }
  params.set("image", fullImageUrl(product.image));
  if (potter) {
    const productPageUrl = `${SITE_BASE}/${potter.slug}/${product.slug}`;
    params.set("url", productPageUrl);
  }
  return `${FOXYCART_CART_BASE}?${params.toString()}`;
}
