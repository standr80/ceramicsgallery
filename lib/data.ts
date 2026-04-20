import type { Course, Potter, Product } from "@/types";
import pottersData from "@/data/potters.json";
import { createClient } from "@/lib/supabase/server";

const staticPotters: Potter[] = pottersData as Potter[];

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
    description: row.description ?? "",
    descriptionExtended: row.description_extended ?? undefined,
    price: Number(row.price) || 0,
    currency: row.currency ?? "GBP",
    image: row.image || "/images/placeholder.svg",
    images: row.images?.length ? row.images : undefined,
    featured: Boolean(row.featured),
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
    stripe_account_id?: string | null;
  },
  products: Product[]
): Potter {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    biography: row.biography ?? "",
    image: row.image ?? undefined,
    products,
    stripe_account_id: row.stripe_account_id ?? undefined,
  };
}

async function getDbPotters(includeInactive = false): Promise<Potter[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("potters")
      .select("id, slug, name, biography, image, website, stripe_account_id");
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

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category?: string;
  featured?: boolean;
  potterSlug: string;
  potterName: string;
}

export async function getAllProducts(): Promise<ShopProduct[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, description, price, currency, image, category, featured, potter_id, potters!inner(slug, name, active)")
      .eq("active", true)
      .eq("potters.active", true)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => {
      const potter = row.potters as unknown as { slug: string; name: string };
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description ?? "",
        price: Number(row.price) || 0,
        currency: row.currency ?? "GBP",
        image: row.image || "/images/placeholder.svg",
        category: row.category ?? undefined,
        featured: Boolean(row.featured),
        potterSlug: potter?.slug ?? "",
        potterName: potter?.name ?? "",
      };
    });
  } catch {
    return [];
  }
}

export async function getShopFilterOptions(products: ShopProduct[]) {
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort() as string[];

  const pottersMap = new Map<string, string>();
  for (const p of products) {
    if (p.potterSlug) pottersMap.set(p.potterSlug, p.potterName);
  }
  const potters = Array.from(pottersMap.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { categories, potters };
}

export async function getCoursesByPotterId(potterId: string): Promise<Course[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, type, start_date, end_date, price, currency, duration, skill_level, location, max_participants, url, potter_id, potters(slug)")
      .eq("active", true)
      .eq("potter_id", potterId)
      .order("start_date", { ascending: true, nullsFirst: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      potterSlug: (row.potters as unknown as { slug: string } | null)?.slug ?? "",
      title: row.title,
      description: row.description ?? "",
      type: row.type ?? "",
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      price: Number(row.price) || 0,
      currency: row.currency ?? "GBP",
      duration: row.duration ?? "",
      skillLevel: (row.skill_level as Course["skillLevel"]) ?? undefined,
      location: row.location ?? undefined,
      maxParticipants: row.max_participants ?? undefined,
      url: row.url ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function getCourses(): Promise<Course[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, type, start_date, end_date, price, currency, duration, skill_level, location, max_participants, url, potter_id, potters(slug)")
      .eq("active", true)
      .order("start_date", { ascending: true, nullsFirst: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      potterSlug: (row.potters as unknown as { slug: string } | null)?.slug ?? "",
      title: row.title,
      description: row.description ?? "",
      type: row.type ?? "",
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      price: Number(row.price) || 0,
      currency: row.currency ?? "GBP",
      duration: row.duration ?? "",
      skillLevel: (row.skill_level as Course["skillLevel"]) ?? undefined,
      location: row.location ?? undefined,
      maxParticipants: row.max_participants ?? undefined,
      url: row.url ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function getCourseFilterOptions(): Promise<{
  types: string[];
  potters: { slug: string; name: string }[];
  durations: string[];
  skillLevels: string[];
  locations: string[];
}> {
  const courses = await getCourses();
  const allPotters = await getAllPotters();

  const types = Array.from(new Set(courses.map((c) => c.type).filter(Boolean))).sort();
  const pottersMap = new Map<string, string>();
  for (const c of courses) {
    if (!c.potterSlug) continue;
    const potter = allPotters.find((p) => p.slug === c.potterSlug);
    if (potter) pottersMap.set(c.potterSlug, potter.name);
  }
  const potters = Array.from(pottersMap.entries()).map(([slug, name]) => ({ slug, name }));
  const durations = Array.from(new Set(courses.map((c) => c.duration).filter(Boolean))).sort(
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
