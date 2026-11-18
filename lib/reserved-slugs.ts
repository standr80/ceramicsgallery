/** Potter page addresses that would clash with site routes (ceramicsgallery.co.uk/<slug>). */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "dashboard", "login", "signup", "logout", "forgot-password", "forgot-email",
  "reset-password", "shop", "potters", "courses", "about", "contact", "help", "terms", "privacy",
  "blog", "news", "merch", "journal", "search", "cart", "checkout", "settings", "static", "images", "public", "www", "ceramics-gallery",
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
