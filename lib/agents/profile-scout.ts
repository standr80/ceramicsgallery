import Firecrawl from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

interface ScrapeResult {
  markdown: string;
  ogImage: string | null;
}

async function scrapeUrl(
  firecrawl: InstanceType<typeof Firecrawl>,
  url: string
): Promise<ScrapeResult> {
  const result = await firecrawl.scrape(url, { formats: ["markdown"] });
  const markdown = result.markdown
    ? `## ${result.metadata?.title ?? url}\n\n${result.markdown}`
    : "";
  const ogImage = (result.metadata?.ogImage as string | undefined) ?? null;
  return { markdown, ogImage };
}

export async function runProfileScout(
  potterId: string,
  mainUrl: string,
  aboutUrl?: string | null
) {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!firecrawlKey || !anthropicKey) {
    console.error("[profile-scout] Missing API keys");
    return { error: "Missing API keys" };
  }

  console.log(`[profile-scout] Starting for potter ${potterId}`);

  const admin = createAdminClient();

  // Check whether the potter already has a profile image
  const { data: potter } = await admin
    .from("potters")
    .select("image")
    .eq("id", potterId)
    .single();

  const hasImage = !!(potter?.image);

  const firecrawl = new Firecrawl({ apiKey: firecrawlKey });
  const sections: string[] = [];
  const ogImages: string[] = [];

  try {
    const main = await scrapeUrl(firecrawl, mainUrl);
    if (main.markdown) sections.push(main.markdown);
    if (main.ogImage) ogImages.push(main.ogImage);
  } catch (err) {
    console.error("[profile-scout] Failed to scrape main URL:", err);
  }

  if (aboutUrl) {
    try {
      const about = await scrapeUrl(firecrawl, aboutUrl);
      if (about.markdown) sections.push(about.markdown);
      if (about.ogImage) ogImages.push(about.ogImage);
    } catch (err) {
      console.error("[profile-scout] Failed to scrape about URL:", err);
    }
  }

  if (sections.length === 0) {
    return { error: "No content scraped from website" };
  }

  const content = sections.join("\n\n---\n\n");
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // ── Biography ──────────────────────────────────────────────────────────
  let biography = "";
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: `You are writing a professional biography for a ceramics artist to appear on a pottery marketplace website.
Write in third person, 150–250 words. Focus on their practice, influences, style, and the types of work they make.
Return ONLY the biography text, no headings or extra commentary.`,
      messages: [
        {
          role: "user",
          content: `Here is content scraped from the potter's website. Write their biography:\n\n${content.slice(0, 40000)}`,
        },
      ],
    });
    biography =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
  } catch (err) {
    console.error("[profile-scout] Claude error:", err);
    return { error: "Claude failed to generate biography" };
  }

  if (!biography) return { error: "Empty biography generated" };

  // ── Profile image ──────────────────────────────────────────────────────
  let profileImage: string | null = null;

  if (!hasImage) {
    // Prefer OG image from scraped pages (about page takes priority)
    profileImage = ogImages[ogImages.length - 1] ?? ogImages[0] ?? null;

    // If no OG image, ask Claude to extract a portrait/headshot URL from the content
    if (!profileImage) {
      try {
        const imgMessage = await anthropic.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 256,
          system: `Extract a single image URL of the potter (a portrait, headshot, or photo of the ceramics artist) from the website content.
Return ONLY the full image URL (starting with http or https), nothing else.
If no suitable portrait or headshot image URL is present, return the word null.`,
          messages: [
            {
              role: "user",
              content: `Find a portrait or headshot image URL of the potter:\n\n${content.slice(0, 40000)}`,
            },
          ],
        });
        const raw =
          imgMessage.content[0].type === "text"
            ? imgMessage.content[0].text.trim()
            : "";
        if (raw && raw !== "null" && raw.startsWith("http")) {
          profileImage = raw;
        }
      } catch (err) {
        console.error("[profile-scout] Image extraction error (non-fatal):", err);
      }
    }
  }

  // ── Persist ────────────────────────────────────────────────────────────
  const updates: Record<string, string> = { biography };
  if (profileImage) updates.image = profileImage;

  const { error } = await admin
    .from("potters")
    .update(updates)
    .eq("id", potterId);

  if (error) {
    console.error("[profile-scout] Failed to update potter:", error);
    return { error: error.message };
  }

  console.log(
    `[profile-scout] Done for potter ${potterId}. Image: ${profileImage ? "set" : "not found"}`
  );
  return { success: true };
}
