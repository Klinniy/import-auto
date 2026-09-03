import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoJsonLd from "@/components/SeoJsonLd";
import SeoVehicleCollection from "@/components/SeoVehicleCollection";
import { breadcrumbJsonLd } from "@/lib/seo";
import {
  getJapanSeoBrands,
  getJapanSeoCars,
  getJapanSeoModels,
  resolveSeoItem,
  seoSlug,
} from "@/lib/seo/catalog-data";

type Params = Promise<{ brand: string }> | { brand: string };

async function resolveBrand(slug: string) {
  const brands = await getJapanSeoBrands();
  return resolveSeoItem(brands, slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const brand = await resolveBrand(p.brand);

  if (!brand) {
    return { title: "Марка не найдена", robots: { index: false, follow: false } };
  }

  const slug = seoSlug(brand.name);
  const title = `${brand.name} из Японии с аукционов`;
  const description = `Автомобили ${brand.name} из Японии: актуальные аукционные лоты, цены, фото, пробег, характеристики и расчёт ориентировочной стоимости.`;

  return {
    title,
    description,
    alternates: { canonical: `/japan/brand/${slug}` },
    openGraph: {
      url: `/japan/brand/${slug}`,
      title: `${title} | MosaicAuto`,
      description,
    },
  };
}

export default async function JapanBrandPage({ params }: { params: Params }) {
  const p = await params;
  const brand = await resolveBrand(p.brand);
  if (!brand) notFound();

  const slug = seoSlug(brand.name);
  const [models, catalog] = await Promise.all([
    getJapanSeoModels(brand.name),
    getJapanSeoCars(brand.name, undefined, 12),
  ]);

  const path = `/japan/brand/${slug}`;
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
          { name: "Авто из Японии", path: "/japan" },
          { name: brand.name, path },
        ])}
      />
      <SeoVehicleCollection
        market="japan"
        title={`${brand.name} из Японии`}
        description={`В каталоге доступны аукционные автомобили ${brand.name}. Сравните актуальные лоты, характеристики и цены, затем используйте калькулятор для ориентировочного расчёта стоимости.`}
        total={catalog.total}
        catalogHref={`/catalog?brand=${encodeURIComponent(brand.name)}`}
        calculatorHref="/calculator/japan"
        models={modelLinks}
        cars={catalog.items}
      />
    </>
  );
}
