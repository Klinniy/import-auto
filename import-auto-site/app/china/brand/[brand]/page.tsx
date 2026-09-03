import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoJsonLd from "@/components/SeoJsonLd";
import SeoVehicleCollection from "@/components/SeoVehicleCollection";
import { breadcrumbJsonLd } from "@/lib/seo";
import {
  getChinaSeoBrands,
  getChinaSeoCars,
  getChinaSeoModels,
  resolveSeoItem,
  seoSlug,
} from "@/lib/seo/catalog-data";

type Params = Promise<{ brand: string }> | { brand: string };

async function resolveBrand(slug: string) {
  const brands = await getChinaSeoBrands();
  return resolveSeoItem(brands, slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const brand = await resolveBrand(p.brand);

  if (!brand) {
    return { title: "Марка не найдена", robots: { index: false, follow: false } };
  }

  const slug = seoSlug(brand.name);
  const title = `${brand.name} из Китая под заказ`;
  const description = `Автомобили ${brand.name} из Китая: актуальные предложения, фото, характеристики, цены и расчёт ориентировочной итоговой стоимости с доставкой.`;

  return {
    title,
    description,
    alternates: { canonical: `/china/brand/${slug}` },
    openGraph: {
      url: `/china/brand/${slug}`,
      title: `${title} | MosaicAuto`,
      description,
    },
  };
}

export default async function ChinaBrandPage({ params }: { params: Params }) {
  const p = await params;
  const brand = await resolveBrand(p.brand);
  if (!brand) notFound();

  const slug = seoSlug(brand.name);
  const [models, catalog] = await Promise.all([
    getChinaSeoModels(brand.name),
    getChinaSeoCars(brand.name, undefined, 12),
  ]);

  const path = `/china/brand/${slug}`;
  const modelLinks = models
    .filter((item) => item.name && item.count > 0)
    .slice(0, 60)
    .map((item) => ({
      name: item.name,
      count: item.count,
      href: `${path}/${seoSlug(item.name)}`,
    }));

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Китая", path: "/china" },
          { name: brand.name, path },
        ])}
      />
      <SeoVehicleCollection
        market="china"
        title={`${brand.name} из Китая`}
        description={`В каталоге доступны автомобили ${brand.name} из Китая. Сравните актуальные предложения и характеристики, затем используйте калькулятор для ориентировочного расчёта итоговой стоимости.`}
        total={catalog.total}
        catalogHref={`/china?brand=${encodeURIComponent(brand.name)}`}
        calculatorHref="/calculator/china"
        models={modelLinks}
        cars={catalog.items}
      />
    </>
  );
}
