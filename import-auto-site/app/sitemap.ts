import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getSeoSitemapData, seoSlug } from "@/lib/seo/catalog-data";

export const dynamic = "force-dynamic";

const staticEntries: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/japan"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/catalog"), changeFrequency: "hourly", priority: 0.9 },
  { url: absoluteUrl("/statistics"), changeFrequency: "daily", priority: 0.8 },
  { url: absoluteUrl("/calculator/japan"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/china"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/calculator/china"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/how-to-buy"), changeFrequency: "monthly", priority: 0.7 },
];

function safeLastModified(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await getSeoSitemapData();

    const collectionEntries: MetadataRoute.Sitemap = data.collections.map((item) => {
      const root = item.market === "japan" ? "/japan/brand" : "/china/brand";
      const path = item.model
        ? `${root}/${seoSlug(item.brand)}/${seoSlug(item.model)}`
        : `${root}/${seoSlug(item.brand)}`;

      return {
        url: absoluteUrl(path),
        changeFrequency: "daily" as const,
        priority: item.model ? 0.65 : 0.7,
      };
    });

    const lotEntries: MetadataRoute.Sitemap = data.lots.map((item) => ({
      url: absoluteUrl(
        item.market === "japan"
          ? `/catalog/${encodeURIComponent(item.id)}`
          : `/china/${encodeURIComponent(item.id)}`
      ),
      ...(safeLastModified(item.lastModified)
        ? { lastModified: safeLastModified(item.lastModified) }
        : {}),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    const deduped = new Map<string, MetadataRoute.Sitemap[number]>();
    [...staticEntries, ...collectionEntries, ...lotEntries].forEach((entry) => {
      deduped.set(entry.url, entry);
    });

    return Array.from(deduped.values());
  } catch {
    // Если внешний каталог временно недоступен, базовый sitemap всё равно остаётся валидным.
    return staticEntries;
  }
}
