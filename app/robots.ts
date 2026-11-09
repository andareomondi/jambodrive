import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: "https://cosmara.co.ke/sitemap.xml",
    host: "https://cosmara.co.ke",
  };
}
