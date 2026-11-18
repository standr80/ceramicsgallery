import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api/", "/auth/", "/login", "/forgot-password", "/forgot-email", "/reset-password"],
    },
    sitemap: "https://www.ceramicsgallery.co.uk/sitemap.xml",
  };
}
