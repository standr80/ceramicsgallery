import Firecrawl, { type Document } from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function runOnboardingScout(potterId: string, websiteUrl: string) {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!firecrawlKey) {
    console.error("[onboarding-scout] FIRECRAWL_API_KEY not set");
    return { error: "FIRECRAWL_API_KEY not set" };
  }
  if (!anthropicKey) {
    console.error("[onboarding-scout] ANTHROPIC_API_KEY not set");
    return { error: "ANTHROPIC_API_KEY not set" };
  }

  console.log(`[onboarding-scout] Starting crawl for potter ${potterId}: ${websiteUrl}`);

  // Crawl the potter's website
  const firecrawl = new Firecrawl({ apiKey: firecrawlKey });
  let crawlContent = "";

  try {
    const result = await firecrawl.crawl(websiteUrl, {
      limit: 10,
      maxConcurrency: 1,
      delay: 2000,
      scrapeOptions: { formats: ["markdown"] },
    });

    if (result.status !== "completed" || !result.data || result.data.length === 0) {
      console.error("[onboarding-scout] Firecrawl returned no data, status:", result.status);
      return { error: `Firecrawl status: ${result.status}` };
    }

    crawlContent = result.data
      .map((page: Document) => `## ${page.metadata?.title ?? ""}\n\n${page.markdown ?? ""}`)
      .join("\n\n---\n\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onboarding-scout] Firecrawl error:", err);
    return { error: msg };
  }

  if (!crawlContent.trim()) {
    console.log("[onboarding-scout] No content scraped, aborting.");
    return { error: "No content scraped from website" };
  }

  // Ask Claude to extract products
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const systemPrompt = `You are a product data extraction assistant for a ceramics marketplace. 
Extract individual pottery products from website content and return them as a JSON array.
Each product must have these fields:
- name (string, required): the product name
- description (string, required): a concise 1-2 sentence product description
- descriptionExtended (string, optional): longer description or care instructions if available
- price (number, required): numeric price in the site's currency; use 0 if unclear or unavailable
- currency (string, default "GBP"): 3-letter currency code
- category (string, optional): e.g. "Functional", "Tableware", "Sculptural", "Decorative"
- image (string, optional): the full URL of the primary product image if found
- images (array of strings, optional): any additional image URLs
- sku (string, optional): product code or SKU if shown

Return ONLY a valid JSON array, no markdown fences, no explanation.
If no clear individual products are found, return an empty array [].`;

  const userMessage = `Here is the scraped content from a potter's website. Extract all distinct pottery products:\n\n${crawlContent.slice(0, 80000)}`;

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
      max_tokens: 4096,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      products = parsed;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onboarding-scout] Claude error or parse failure:", err);
    return { error: `Claude error: ${msg}` };
  }

  if (products.length === 0) {
    console.log("[onboarding-scout] Claude found no products.");
    return { error: "No products found on website" };
  }

  console.log(`[onboarding-scout] Claude extracted ${products.length} products.`);

  // Insert drafts into Supabase
  const admin = createAdminClient();
  const usedSlugs = new Set<string>();
  let inserted = 0;

  for (const p of products) {
    const baseName = p.name?.trim() || "Untitled product";
    let slug = slugify(baseName);

    let attempt = slug;
    let n = 1;
    while (usedSlugs.has(attempt)) {
      attempt = `${slug}-${n++}`;
    }
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
      console.error(`[onboarding-scout] Insert failed for "${baseName}":`, error);
    } else {
      inserted++;
    }
  }

  console.log(`[onboarding-scout] Done for potter ${potterId}. Inserted ${inserted} drafts.`);
  return { success: true, inserted };
}
