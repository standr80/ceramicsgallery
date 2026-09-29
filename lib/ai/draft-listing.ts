import Anthropic from "@anthropic-ai/sdk";

export interface DraftedListing {
  title: string;
  description: string;
  glaze_notes: string;
  category: string;
  ai_price_low_pence: number | null;
  ai_price_high_pence: number | null;
}

export async function draftListingFromImages(
  imageUrls: string[]
): Promise<DraftedListing> {
  const client = new Anthropic();

  const imageContent = imageUrls.map((url) => ({
    type: "image" as const,
    source: { type: "url" as const, url },
  }));

  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    system: `You are an expert in handmade ceramics. Given photos of a ceramic piece, produce a listing for an online pottery gallery.
Reply with valid JSON only, no markdown. Use this exact shape:
{
  "title": "Short evocative title (3–6 words)",
  "description": "2–3 sentence description mentioning form, glaze and character",
  "glaze_notes": "Clay body, glaze and firing technique in one sentence",
  "category": "one of: vase, bowl, mug, plate, jar, teapot, sculpture, other",
  "ai_price_low_pence": integer pence or null,
  "ai_price_high_pence": integer pence or null
}
Base price suggestions on typical UK market rates for handmade ceramics.`,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: "Please draft a listing for this ceramic piece." },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as DraftedListing;
}
