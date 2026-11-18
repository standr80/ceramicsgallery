// Blog posts written by Clem in NBLB, read from its public Content API.
// BLOG_TENANT can point local testing at another tenant that already has posts.
// Not cached here: NBLB caches the feed at its edge for 5 minutes, and caching it a second
// time on this side once left /news showing an empty list long after a post went live.

const API = "https://www.nobrandleftbehind.com/api/content/v1/tenants";
const TENANT = process.env.BLOG_TENANT || "ceramicsgallery";

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  meta_description: string | null;
  tags: string[];
  hero_image: string | null;
  hero_image_alt: string | null;
  hero_image_credit: string | null;
  author: string | null;
  published_at: string;
  updated_at: string;
}

export interface Post extends PostSummary {
  body_html: string;
}

export const PER_PAGE = 12;

export async function getPosts(page = 1, tag?: string, perPage = PER_PAGE): Promise<{ posts: PostSummary[]; totalPages: number }> {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage), type: "blog" });
  if (tag) qs.set("tag", tag);
  try {
    const res = await fetch(`${API}/${TENANT}/posts?${qs}`, { cache: "no-store" });
    if (!res.ok) return { posts: [], totalPages: 1 };
    const json = await res.json();
    return { posts: json.posts ?? [], totalPages: json.total_pages ?? 1 };
  } catch {
    return { posts: [], totalPages: 1 };
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!/^[a-z0-9-]{1,200}$/i.test(slug)) return null;
  try {
    const res = await fetch(`${API}/${TENANT}/posts/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const post = json.post ?? json;
    return post?.body_html && !post.deleted ? post : null;
  } catch {
    return null;
  }
}

export const fmtPostDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
