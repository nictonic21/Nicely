import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return ["", "/signup", "/terms", "/privacy"].map((p) => ({ url: `${base}${p}` }));
}
