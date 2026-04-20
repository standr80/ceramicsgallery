import Firecrawl from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runCoursesScout(potterId: string, coursesUrl: string) {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!firecrawlKey || !anthropicKey) {
    console.error("[courses-scout] Missing API keys");
    return { error: "Missing API keys" };
  }

  console.log(`[courses-scout] Starting for potter ${potterId}: ${coursesUrl}`);

  const firecrawl = new Firecrawl({ apiKey: firecrawlKey });
  let content = "";

  try {
    const result = await firecrawl.scrape(coursesUrl, { formats: ["markdown"] });
    if (!result.markdown) {
      return { error: "No content returned from courses page" };
    }
    content = `## ${result.metadata?.title ?? coursesUrl}\n\n${result.markdown}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[courses-scout] Firecrawl error:", err);
    return { error: msg };
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let courses: Array<{
    title: string;
    description: string;
    type?: string;
    start_date?: string;
    end_date?: string;
    price: number;
    currency?: string;
    duration?: string;
    skill_level?: string;
    location?: string;
    max_participants?: number;
    url?: string;
  }> = [];

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: `You are a course data extraction assistant for a ceramics marketplace.
Extract individual pottery courses or workshops from website content and return them as a JSON array.
Each course must have these fields:
- title (string, required): the course or workshop name
- description (string, required): a concise 1-2 sentence description
- type (string, optional): e.g. "Wheel throwing", "Hand building", "One-day workshop", "6-week course"
- start_date (string, optional): ISO date YYYY-MM-DD if a specific date is mentioned
- end_date (string, optional): ISO date YYYY-MM-DD for multi-day courses
- price (number, required): numeric price; use 0 if unclear
- currency (string, default "GBP"): 3-letter currency code
- duration (string, optional): e.g. "1 day", "Half day", "6 weeks"
- skill_level (string, optional): one of "beginner", "intermediate", "advanced", "all"
- location (string, optional): where the course takes place
- max_participants (number, optional): maximum class size if mentioned
- url (string, optional): the full URL (https://...) of the specific course or booking page if one is linked

Return ONLY a valid JSON array, no markdown fences, no explanation.
If no clear courses or workshops are found, return an empty array [].`,
      messages: [
        {
          role: "user",
          content: `Extract all distinct pottery courses and workshops from this page:\n\n${content.slice(0, 80000)}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences Claude sometimes adds despite instructions
    const text = raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) courses = parsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[courses-scout] Claude error:", err);
    return { error: `Claude error: ${msg}` };
  }

  if (courses.length === 0) {
    console.log("[courses-scout] No courses found.");
    return { error: "No courses found on page" };
  }

  const admin = createAdminClient();
  let inserted = 0;

  for (const c of courses) {
    const { error } = await admin.from("courses").insert({
      potter_id: potterId,
      title: c.title?.trim() || "Untitled course",
      description: c.description ?? "",
      type: c.type ?? null,
      start_date: c.start_date ?? null,
      end_date: c.end_date ?? null,
      price: typeof c.price === "number" ? c.price : 0,
      currency: c.currency ?? "GBP",
      duration: c.duration ?? null,
      skill_level: c.skill_level ?? null,
      location: c.location ?? null,
      max_participants: c.max_participants ?? null,
      active: false,
      source: "onboarding-scout",
      url: c.url ?? null,
    });

    if (error) {
      console.error(`[courses-scout] Insert failed for "${c.title}":`, error);
    } else {
      inserted++;
    }
  }

  console.log(`[courses-scout] Done. Inserted ${inserted} draft courses.`);
  return { success: true, inserted };
}
