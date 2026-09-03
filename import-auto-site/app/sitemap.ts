import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getSeoSitemapData, seoSlug } from "@/lib/seo/catalog-data";

const basePages: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/japan"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/catalog"), changeFrequency: "hourly", priority: 0.9 },
  { url: absoluteUrl("/statistics"), changeFrequency: "daily", priority: 0.8 },
  { url: absoluteUrl("/calculator/japan"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/china"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/calculator/china"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/how-to-buy"), changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await getSeoSitemapData();

    const lotPages: MetadataRoute.Sitemap = data.lots.map((lot) => ({
      url: absoluteUrl(
        lot.market === "japan"
          ? `/catalog/${encodeURIComponent(lot.id)}`
          : `/china/${encodeURIComponent(lot.id)}`
      ),
      changeFrequency: "daily",
      priority: 0.65,
      ...(lot.lastModified ? { lastModified: lot.lastModified } : {}),
    }));

    const collectionPages: MetadataRoute.Sitemap = data.collections.map((item) => {
      const brand = seoSlug(item.brand);
      const model = item.model ? seoSlug(item.model) : "";
      const path = item.model
        ? `/${item.market}/brand/${brand}/${model}`
        : `/${item.market}/brand/${brand}`;

      return {
        url: absoluteUrl(path),
        changeFrequency: "daily",
        priority: item.model ? 0.7 : 0.75,
      };
    });

    return [...basePages, ...collectionPages, ...lotPages];
  } catch {
    // Поисковики всё равно получают стабильный базовый sitemap,
    // если внешний каталог временно недоступен.
    return basePages;
  }
}
