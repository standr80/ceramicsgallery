import Firecrawl from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

async function scrapeUrl(firecrawl: InstanceType<typeof Firecrawl>, url: string): Promise<string> {
  const result = await firecrawl.scrape(url, { formats: ["markdown"] });
  if (!result.markdown) return "";
  return `## ${result.metadata?.title ?? url}\n\n${result.markdown}`;
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

  const firecrawl = new Firecrawl({ apiKey: firecrawlKey });
  const sections: string[] = [];

  try {
    const main = await scrapeUrl(firecrawl, mainUrl);
    if (main) sections.push(main);
  } catch (err) {
    console.error("[profile-scout] Failed to scrape main URL:", err);
  }

  if (aboutUrl) {
    try {
      const about = await scrapeUrl(firecrawl, aboutUrl);
      if (about) sections.push(about);
    } catch (err) {
      console.error("[profile-scout] Failed to scrape about URL:", err);
    }
  }

  if (sections.length === 0) {
    return { error: "No content scraped from website" };
  }

  const content = sections.join("\n\n---\n\n");
  const anthropic = new Anthropic({ apiKey: anthropicKey });

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

  const admin = createAdminClient();
  const { error } = await admin
    .from("potters")
    .update({ biography })
    .eq("id", potterId);

  if (error) {
    console.error("[profile-scout] Failed to update biography:", error);
    return { error: error.message };
  }

  console.log(`[profile-scout] Done for potter ${potterId}`);
  return { success: true };
}
