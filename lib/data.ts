import type { Course, Potter, Product } from "@/types";
import pottersData from "@/data/potters.json";
import coursesData from "@/data/courses.json";

const potters: Potter[] = pottersData as Potter[];
const courses: Course[] = coursesData as Course[];

export function getAllPotters(): Potter[] {
  return potters;
}

export function getPotterBySlug(slug: string): Potter | undefined {
  return potters.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return potters.map((p) => p.slug);
}

/** Featured products from across all potters (for home page) */
export function getFeaturedProducts(): { product: Product; potter: Potter }[] {
  const featured: { product: Product; potter: Potter }[] = [];
  for (const potter of potters) {
    for (const product of potter.products) {
      if (product.featured) {
        featured.push({ product, potter });
      }
    }
  }
  return featured;
}

/** Get a product by potter slug and product slug (for product page) */
export function getProductBySlugs(
  potterSlug: string,
  productSlug: string
): { product: Product; potter: Potter } | undefined {
  const potter = getPotterBySlug(potterSlug);
  if (!potter) return undefined;
  const product = potter.products.find((p) => p.slug === productSlug);
  if (!product) return undefined;
  return { product, potter };
}

/** All [potterSlug, productSlug] pairs for static product page generation */
export function getAllProductPaths(): { slug: string; productSlug: string }[] {
  const paths: { slug: string; productSlug: string }[] = [];
  for (const potter of potters) {
    for (const product of potter.products) {
      paths.push({ slug: potter.slug, productSlug: product.slug });
    }
  }
  return paths;
}

/** All courses (for Courses page) */
export function getCourses(): Course[] {
  return courses;
}

/** Course filter options: unique types, potters (slug + name), durations, skill levels, locations */
export function getCourseFilterOptions(): {
  types: string[];
  potters: { slug: string; name: string }[];
  durations: string[];
  skillLevels: string[];
  locations: string[];
} {
  const types = Array.from(new Set(courses.map((c) => c.type))).sort();
  const pottersMap = new Map<string, string>();
  for (const c of courses) {
    const potter = getPotterBySlug(c.potterSlug);
    if (potter) pottersMap.set(c.potterSlug, potter.name);
  }
  const potters = Array.from(pottersMap.entries()).map(([slug, name]) => ({ slug, name }));
  const durations = Array.from(new Set(courses.map((c) => c.duration))).sort(
    (a, b) => durationSortOrder(a) - durationSortOrder(b)
  );
  const skillLevels = Array.from(new Set(courses.flatMap((c) => (c.skillLevel ? [c.skillLevel] : [])))).sort(
    (a, b) => skillLevelOrder(a) - skillLevelOrder(b)
  );
  const locations = Array.from(new Set(courses.map((c) => c.location).filter(Boolean))).sort() as string[];
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
  const order: Record<string, number> = { beginner: 0, "all": 1, intermediate: 2, advanced: 3 };
  return order[s] ?? 99;
}
