export interface Product {
  id: string;
  /** URL slug for the product page (e.g. large-stoneware-bowl) */
  slug: string;
  name: string;
  description: string;
  /** Extended description for the product page (optional) */
  descriptionExtended?: string;
  price: number;
  currency: string;
  image: string;
  /** Additional images for the product page gallery (any number) */
  images?: string[];
  featured?: boolean;
  /** For future Foxycart/Ecwid: product code or SKU */
  sku?: string;
  /** Display category (e.g. Functional, Tableware) */
  category?: string;
}

export interface Potter {
  id: string;
  slug: string;
  name: string;
  biography: string;
  image?: string;
  products: Product[];
  /** Optional: email/contact for future use */
  email?: string;
  /** Stripe Connect account ID for receiving payouts */
  stripe_account_id?: string;
}

export interface Course {
  id: string;
  potterSlug: string;
  title: string;
  description: string;
  /** e.g. "Wheel throwing", "Hand building", "One-day workshop" */
  type: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate?: string; // optional for multi-day
  price: number;
  currency: string;
  /** e.g. "1 day", "6 weeks", "Half day" */
  duration: string;
  /** For filtering by skill level */
  skillLevel?: "beginner" | "intermediate" | "advanced" | "all";
  location?: string;
  maxParticipants?: number;
}
