import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getSeoSitemapData, seoSlug } from "@/lib/seo/catalog-data";

const BASE_SITEMAP: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/japan"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/catalog"), changeFrequency: "hourly", priority: 0.9 },
  { url: absoluteUrl("/statistics"), changeFrequency: "daily", priority: 0.8 },
  { url: absoluteUrl("/calculator/japan"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/china"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/calculator/china"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/how-to-buy"), changeFrequency: "monthly", priority: 0.7 },
];

function safeDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await getSeoSitemapData();

    const collections: MetadataRoute.Sitemap = data.collections
      .map((item) => {
        const brand = seoSlug(item.brand);
        const model = item.model ? seoSlug(item.model) : "";
        if (!brand) return null;

        const base = item.market === "japan" ? "/japan/brand" : "/china/brand";
        const path = model ? `${base}/${brand}/${model}` : `${base}/${brand}`;

        return {
          url: absoluteUrl(path),
          changeFrequency: "daily" as const,
          priority: model ? 0.66 : 0.7,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;

    const lots: MetadataRoute.Sitemap = data.lots.map((item) => {
      const path =
        item.market === "japan"
          ? `/catalog/${encodeURIComponent(item.id)}`
          : `/china/${encodeURIComponent(item.id)}`;

      return {
        url: absoluteUrl(path),
        changeFrequency: "daily" as const,
        priority: 0.62,
        ...(safeDate(item.lastModified) ? { lastModified: safeDate(item.lastModified) } : {}),
      };
    });

    return [...BASE_SITEMAP, ...collections, ...lots];
  } catch (error) {
    console.error("SEO sitemap dynamic data failed", error);
    return BASE_SITEMAP;
  }
}
