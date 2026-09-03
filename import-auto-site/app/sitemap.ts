import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/japan"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/catalog"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/statistics"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/calculator/japan"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/china"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/calculator/china"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/how-to-buy"), changeFrequency: "monthly", priority: 0.7 },
  ];
}
