import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPosts } from "@/lib/blog";

const BASE = "https://www.ceramicsgallery.co.uk";

export const revalidate = 3600;

// Real (non-demo) published potters, their live pieces, published courses and news posts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createAdminClient();

  const { data: potters } = await db
    .from("potters")
    .select("id, slug, updated_at")
    .eq("is_published", true)
    .eq("is_demo", false);
  const potterIds = (potters ?? []).map((p) => p.id);
  const slugById = new Map((potters ?? []).map((p) => [p.id, p.slug]));

  const [{ data: pieces }, { data: courses }] = potterIds.length
    ? await Promise.all([
        db.from("pieces").select("id, potter_id, updated_at").in("potter_id", potterIds).in("status", ["live", "sold"]),
        db.from("courses").select("id, updated_at").in("potter_id", potterIds).eq("is_published", true),
      ])
    : [{ data: [] }, { data: [] }];

  const news = [];
  for (let page = 1; page <= 10; page++) {
    const { posts, totalPages } = await getPosts(page, undefined, 100);
    news.push(...posts);
    if (page >= totalPages) break;
  }

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/potters`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/courses`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/news`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/signup`, changeFrequency: "monthly", priority: 0.4 },
    ...(potters ?? []).map((p) => ({ url: `${BASE}/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...(pieces ?? []).map((p) => ({ url: `${BASE}/${slugById.get(p.potter_id)}/${p.id}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(courses ?? []).map((c) => ({ url: `${BASE}/courses/${c.id}`, lastModified: c.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...news.map((p) => ({ url: `${BASE}/news/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
