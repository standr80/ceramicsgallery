import Firecrawl from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_PRODUCT_PAGES = 15;

// Paths that are clearly not individual product detail pages
const NON_PRODUCT_PATH_RE =
  /\/(cart|checkout|account|login|register|signup|blog|news|about|contact|search|tag|category|categories|collections$|pages\/|faq|terms|privacy|shipping|returns|press|events|gallery$|home$|\?)/i;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function isLikelyProductPage(url: string, shopUrl: string): boolean {
  try {
    const shopOrigin = new URL(shopUrl).origin;
    const parsed = new URL(url);
    // Must be same origin and not a fragment-only or root URL
    if (parsed.origin !== shopOrigin) return false;
    if (parsed.pathname === "/" || parsed.pathname === "") return false;
    if (NON_PRODUCT_PATH_RE.test(parsed.pathname + parsed.search)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function runShopScout(potterId: string, shopUrl: string) {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!firecrawlKey || !anthropicKey) {
    console.error("[shop-scout] Missing API keys");
    return { error: "Missing API keys" };
  }

  console.log(`[shop-scout] Starting for potter ${potterId}: ${shopUrl}`);

  const firecrawl = new Firecrawl({ apiKey: firecrawlKey });

  // ── Step 1: Scrape the listing page ───────────────────────────────────────
  let listingMarkdown = "";
  try {
    const result = await firecrawl.scrape(shopUrl, { formats: ["markdown"] });
    if (!result.markdown) {
      return { error: "No content returned from shop page" };
    }
    listingMarkdown = `# SHOP LISTING: ${result.metadata?.title ?? shopUrl}\n\n${result.markdown}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[shop-scout] Firecrawl scrape error:", err);
    return { error: msg };
  }

  // ── Step 2: Discover product page URLs via map ─────────────────────────────
  let productPageUrls: string[] = [];
  try {
    const mapResult = await firecrawl.map(shopUrl, { limit: 60 });
    // SDK v4 returns MapData where links is SearchResultWeb[] (objects with .url), not string[]
    const links: string[] = mapResult.links?.map((l) => l.url).filter(Boolean) ?? [];
    productPageUrls = links
      .filter((u) => isLikelyProductPage(u, shopUrl))
      .slice(0, MAX_PRODUCT_PAGES);
    console.log(`[shop-scout] Found ${productPageUrls.length} potential product pages`);
  } catch (err) {
    // Non-fatal — proceed with listing page content only
    console.warn("[shop-scout] Map step failed, using listing page only:", err);
  }

  // ── Step 3: Batch-scrape individual product pages ─────────────────────────
  let productPagesContent = "";
  if (productPageUrls.length > 0) {
    try {
      const batchResult = await firecrawl.batchScrape(productPageUrls, {
        options: {
          formats: ["markdown"],
          // Give JS time to render and expand any lazy-loaded content
          waitFor: 1500,
          // Try to click common "read more" / accordion patterns before scraping
          actions: [
            { type: "click", selector: "[data-read-more], .read-more, .show-more, [aria-expanded='false'], details summary, .accordion__button, .product-description__toggle" },
            { type: "wait", milliseconds: 800 },
          ],
        },
      });
      const pages = batchResult.data ?? [];
      for (const page of pages) {
        if (page.markdown) {
          productPagesContent += `\n\n# PRODUCT PAGE: ${page.metadata?.title ?? ""}\n\n${page.markdown}`;
        }
      }
      console.log(`[shop-scout] Batch-scraped ${pages.length} product pages`);
    } catch (err) {
      console.warn("[shop-scout] Batch scrape failed, using listing page only:", err);
    }
  }

  const content = (listingMarkdown + productPagesContent).slice(0, 100000);

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let products: Array<{
    name: string;
    description: string;
    descriptionExtended?: string;
    price: number;
    currency?: string;
    category?: string;
    image?: string;
    images?: string[];
    sku?: string;
  }> = [];

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      system: `You are a product data extraction assistant for a ceramics marketplace.
The content below comes from a potter's shop page plus individual product detail pages scraped separately.
Extract every distinct pottery product and return them as a JSON array.

Each product object must have:
- name (string, required): the product name
- description (string, required): a concise 1–2 sentence summary suitable for a product listing card
- descriptionExtended (string, optional): ONLY populate with genuinely additional detail that goes beyond the short description above — e.g. clay body and materials, dimensions and weight, firing technique and temperature, glaze details, surface texture, edition size, care instructions, or other specifics the potter provided on their product detail page. Do NOT copy, rephrase, or repeat the short description. If the product page contains no substantially richer information than what is already in description, omit this field entirely (do not set it to an empty string or duplicate text).
- price (number, required): numeric price; use 0 if not shown
- currency (string, default "GBP"): ISO 4217 code
- category (string, optional): one of "Functional", "Tableware", "Sculptural", "Decorative", "Vases & Vessels", "Jewellery", "Tiles", "Other"
- image (string, optional): absolute URL of the primary product image
- images (array of strings, optional): any additional image URLs
- sku (string, optional): product code or SKU

Deduplication: if the same product appears in both the listing section and a detail section, merge the data and prefer the richer detail-page content.

Return ONLY a valid JSON array, no markdown fences, no explanation.
If no clear products are found, return [].`,
      messages: [
        {
          role: "user",
          content: `Extract all pottery products from the content below.\n\n${content}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences Claude sometimes adds despite instructions
    const text = raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) products = parsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[shop-scout] Claude error:", err);
    return { error: `Claude error: ${msg}` };
  }

  if (products.length === 0) {
    console.log("[shop-scout] No products found.");
    return { error: "No products found on shop page" };
  }

  const admin = createAdminClient();

  // Remove all previously scout-created products for this potter (draft and published)
  // so that re-running the scout never duplicates content. Manually created products
  // (source = 'manual') are never touched.
  const { error: deleteError } = await admin
    .from("products")
    .delete()
    .eq("potter_id", potterId)
    .eq("source", "onboarding-scout");

  if (deleteError) {
    console.error("[shop-scout] Failed to clear previous scout products:", deleteError);
    return { error: `Cleanup failed: ${deleteError.message}` };
  }

  const usedSlugs = new Set<string>();
  let inserted = 0;

  for (const p of products) {
    const baseName = p.name?.trim() || "Untitled product";
    let slug = slugify(baseName);
    let attempt = slug;
    let n = 1;
    while (usedSlugs.has(attempt)) attempt = `${slug}-${n++}`;
    slug = attempt;
    usedSlugs.add(slug);

    const { error } = await admin.from("products").insert({
      potter_id: potterId,
      name: baseName,
      slug,
      description: p.description ?? "",
      description_extended: p.descriptionExtended ?? null,
      price: typeof p.price === "number" ? p.price : 0,
      currency: p.currency ?? "GBP",
      category: p.category ?? null,
      image: p.image ?? null,
      images: p.images ?? null,
      sku: p.sku ?? null,
      active: false,
      source: "onboarding-scout",
    });

    if (error) {
      console.error(`[shop-scout] Insert failed for "${baseName}":`, error);
    } else {
      inserted++;
    }
  }

  console.log(`[shop-scout] Done. Inserted ${inserted} draft products.`);
  return { success: true, inserted };
}
