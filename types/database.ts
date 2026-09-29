export type PieceStatus = "draft" | "live" | "reserved" | "sold" | "archived";
export type OrderStatus = "pending" | "paid" | "dispatched" | "collected" | "completed" | "refunded" | "cancelled";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "refunded";
export type CourseFormat = "taster" | "one_day" | "weekend" | "weekly" | "one_to_one" | "online";
export type CourseLevel = "beginner" | "improver" | "intermediate" | "advanced" | "all";
export type Plan = "free" | "pro" | "studio";

export interface Potter {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  studio_name: string | null;
  headline: string | null;
  bio: string | null;
  bio_source_audio: string | null;
  avatar_path: string | null;
  location_label: string | null;
  instagram: string | null;
  website_url: string | null;
  stripe_account_id: string | null;
  stripe_charges_ok: boolean;
  stripe_payouts_ok: boolean;
  plan: Plan;
  commission_bps: number;
  onboarding_step: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PotterTaxDetails {
  potter_id: string;
  legal_name: string;
  is_business: boolean;
  company_number: string | null;
  tax_reference: string | null;
  date_of_birth: string | null;
  primary_address: Record<string, unknown>;
  vat_registered: boolean;
  collected_at: string;
}

export interface Site {
  potter_id: string;
  template: string;
  theme: Record<string, unknown>;
  custom_domain: string | null;
  domain_verified: boolean;
  hero_piece_id: string | null;
  show_courses: boolean;
  show_shop: boolean;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
}

export interface Category {
  id: number;
  slug: string;
  label: string;
  sort_order: number;
}

export interface ShippingBand {
  id: number;
  code: string;
  label: string;
  max_weight_g: number | null;
  max_longest_cm: number | null;
  default_price_pence: number;
}

export interface Piece {
  id: string;
  potter_id: string;
  status: PieceStatus;
  title: string;
  description: string | null;
  category_id: number | null;
  clay_body: string | null;
  glaze_notes: string | null;
  firing: string | null;
  height_cm: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  weight_g: number | null;
  food_safe: boolean | null;
  price_pence: number | null;
  quantity: number;
  shipping_band_id: number | null;
  collection_available: boolean;
  ai_draft: Record<string, unknown> | null;
  ai_price_low_pence: number | null;
  ai_price_high_pence: number | null;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PieceImage {
  id: string;
  piece_id: string;
  position: number;
  original_path: string;
  processed_path: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  potter_id: string;
  title: string;
  description: string | null;
  format: CourseFormat;
  level: CourseLevel;
  techniques: string[];
  duration_minutes: number | null;
  price_pence: number;
  deposit_pence: number | null;
  includes: string | null;
  venue_name: string | null;
  venue_address: string | null;
  is_online: boolean;
  max_places: number;
  min_age: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseSession {
  id: string;
  course_id: string;
  starts_at: string;
  ends_at: string;
  places_total: number;
  places_booked: number;
  is_cancelled: boolean;
}

export interface Customer {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  potter_id: string;
  customer_id: string;
  piece_id: string;
  quantity: number;
  status: OrderStatus;
  fulfilment: "ship" | "collect";
  item_pence: number;
  shipping_pence: number;
  total_pence: number;
  application_fee_pence: number;
  stripe_checkout_session: string | null;
  stripe_payment_intent: string | null;
  shipping_address: Record<string, unknown> | null;
  tracking_ref: string | null;
  created_at: string;
  paid_at: string | null;
  dispatched_at: string | null;
}

export interface Booking {
  id: string;
  session_id: string;
  customer_id: string;
  places: number;
  status: BookingStatus;
  amount_pence: number;
  application_fee_pence: number;
  stripe_checkout_session: string | null;
  stripe_payment_intent: string | null;
  notes: string | null;
  created_at: string;
}

// View types
export interface GalleryPiece {
  id: string;
  title: string;
  description: string | null;
  price_pence: number | null;
  height_cm: number | null;
  width_cm: number | null;
  glaze_notes: string | null;
  firing: string | null;
  published_at: string | null;
  category: string | null;
  potter_slug: string;
  potter_name: string;
  location_label: string | null;
  cover_image: string | null;
}

export interface CourseDirectory {
  id: string;
  title: string;
  format: CourseFormat;
  level: CourseLevel;
  techniques: string[];
  price_pence: number;
  is_online: boolean;
  venue_name: string | null;
  potter_slug: string;
  potter_name: string;
  session_id: string;
  starts_at: string;
  ends_at: string;
  places_left: number;
}
