import type { MetadataRoute } from "next";
import { getAvailableCars } from "@/lib/services/cars";

const SITE_URL = "https://cosmara.co.ke";
const CAR_CATEGORIES = [
  "compact",
  "economy",
  "executive",
  "suv",
  "ssuv",
  "vans",
  "trucks",
];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticRoutes = [
    "",
    "/cars",
    "/airport-pickup",
    "/gallery",
    "/faq",
    "/contact",
    "/terms",
    ...CAR_CATEGORIES.map((category) => `/cars/category/${category}`),
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency:
      route === "" || route === "/cars" ? ("daily" as const) : ("weekly" as const),
    priority:
      route === ""
        ? 1
        : route === "/cars" || route === "/airport-pickup"
          ? 0.9
          : 0.7,
  }));

  try {
    const cars = await getAvailableCars();
    return [
      ...staticRoutes,
      ...cars.map((car) => ({
        url: `${SITE_URL}/cars/${encodeURIComponent(car.id)}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] Could not load car detail routes:", error);
    return staticRoutes;
  }
}
