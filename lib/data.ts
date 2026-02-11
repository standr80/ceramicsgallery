import type { Course, Potter, Product } from "@/types";
import pottersData from "@/data/potters.json";
import coursesData from "@/data/courses.json";
import { createClient } from "@/lib/supabase/server";

const staticPotters: Potter[] = pottersData as Potter[];
const courses: Course[] = coursesData as Course[];

function dbProductToProduct(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  description_extended: string | null;
  price: number;
  currency: string;
  image: string;
  images: string[] | null;
  featured: boolean;
  active?: boolean;
  category: string | null;
  sku: string | null;
}): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    descriptionExtended: row.description_extended ?? undefined,
    price: Number(row.price),
    currency: row.currency,
    image: row.image,
    images: row.images?.length ? row.images : undefined,
    featured: row.featured,
    sku: row.sku ?? undefined,
    category: row.category ?? undefined,
  };
}

function dbPotterToPotter(
  row: {
    id: string;
    slug: string;
    name: string;
    biography: string;
    image: string | null;
    website: string | null;
  },
  products: Product[]
): Potter {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    biography: row.biography,
    image: row.image ?? undefined,
    products,
  };
}

async function getDbPotters(includeInactive = false): Promise<Potter[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("potters")
      .select("id, slug, name, biography, image, website");
    if (!includeInactive) {
      query = query.eq("active", true);
    }
    const { data: pottersRows, error: pottersError } = await query;

    if (pottersError || !pottersRows?.length) return [];

    const potterIds = pottersRows.map((r) => r.id);
    let productsQuery = supabase
      .from("products")
      .select("*")
      .in("potter_id", potterIds);
    if (!includeInactive) {
      productsQuery = productsQuery.eq("active", true);
    }
    const { data: productsRows } = await productsQuery;

    const productsByPotter = new Map<string, Product[]>();
    for (const p of productsRows ?? []) {
      const product = dbProductToProduct(p);
      const list = productsByPotter.get(p.potter_id) ?? [];
      list.push(product);
      productsByPotter.set(p.potter_id, list);
    }

    return pottersRows.map((row) =>
      dbPotterToPotter(row, productsByPotter.get(row.id) ?? [])
    );
  } catch {
    return [];
  }
}

export async function getAllPotters(): Promise<Potter[]> {
  const dbPotters = await getDbPotters();
  const dbOnly = dbPotters.filter((p) => !staticPotters.some((s) => s.slug === p.slug));
  return [...staticPotters, ...dbOnly];
}

export async function getPotterBySlug(slug: string): Promise<Potter | undefined> {
  const staticMatch = staticPotters.find((p) => p.slug === slug);
  if (staticMatch) return staticMatch;

  const dbPotters = await getDbPotters();
  return dbPotters.find((p) => p.slug === slug);
}

export async function getAllSlugs(): Promise<string[]> {
  const dbPotters = await getDbPotters();
  return Array.from(
    new Set([...staticPotters.map((p) => p.slug), ...dbPotters.map((p) => p.slug)])
  );
}

export async function getFeaturedProducts(): Promise<{ product: Product; potter: Potter }[]> {
  const allPotters = await getAllPotters();
  const featured: { product: Product; potter: Potter }[] = [];
  for (const potter of allPotters) {
    for (const product of potter.products) {
      if (product.featured) {
        featured.push({ product, potter });
      }
    }
  }
  return featured;
}

export async function getProductBySlugs(
  potterSlug: string,
  productSlug: string
): Promise<{ product: Product; potter: Potter } | undefined> {
  const potter = await getPotterBySlug(potterSlug);
  if (!potter) return undefined;
  const product = potter.products.find((p) => p.slug === productSlug);
  if (!product) return undefined;
  return { product, potter };
}

export async function getAllProductPaths(): Promise<{ slug: string; productSlug: string }[]> {
  const allPotters = await getAllPotters();
  const paths: { slug: string; productSlug: string }[] = [];
  for (const potter of allPotters) {
    for (const product of potter.products) {
      paths.push({ slug: potter.slug, productSlug: product.slug });
    }
  }
  return paths;
}

export function getCourses(): Course[] {
  return courses;
}

export async function getCourseFilterOptions(): Promise<{
  types: string[];
  potters: { slug: string; name: string }[];
  durations: string[];
  skillLevels: string[];
  locations: string[];
}> {
  const allPotters = await getAllPotters();
  const types = Array.from(new Set(courses.map((c) => c.type))).sort();
  const pottersMap = new Map<string, string>();
  for (const c of courses) {
    const potter = allPotters.find((p) => p.slug === c.potterSlug);
    if (potter) pottersMap.set(c.potterSlug, potter.name);
  }
  const potters = Array.from(pottersMap.entries()).map(([slug, name]) => ({ slug, name }));
  const durations = Array.from(new Set(courses.map((c) => c.duration))).sort(
    (a, b) => durationSortOrder(a) - durationSortOrder(b)
  );
  const skillLevels = Array.from(
    new Set(courses.flatMap((c) => (c.skillLevel ? [c.skillLevel] : [])))
  ).sort((a, b) => skillLevelOrder(a) - skillLevelOrder(b));
  const locations = Array.from(
    new Set(courses.map((c) => c.location).filter(Boolean))
  ).sort() as string[];
  return { types, potters, durations, skillLevels, locations };
}

function durationSortOrder(d: string): number {
  const order: Record<string, number> = {
    "Half day": 0,
    "1 day": 1,
    "2 days": 2,
    "6 weeks": 3,
  };
  return order[d] ?? 99;
}

function skillLevelOrder(s: string): number {
  const order: Record<string, number> = {
    beginner: 0,
    all: 1,
    intermediate: 2,
    advanced: 3,
  };
  return order[s] ?? 99;
}
