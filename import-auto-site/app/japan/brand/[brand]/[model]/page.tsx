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

type Params = Promise<{ brand: string; model: string }> | { brand: string; model: string };

async function resolveCollection(brandSlug: string, modelSlug: string) {
  const brands = await getJapanSeoBrands();
  const brand = resolveSeoItem(brands, brandSlug);
  if (!brand) return null;

  const models = await getJapanSeoModels(brand.name);
  const model = resolveSeoItem(models, modelSlug);
  if (!model) return null;

  return { brand, model };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const resolved = await resolveCollection(p.brand, p.model);

  if (!resolved) {
    return { title: "Модель не найдена", robots: { index: false, follow: false } };
  }

  const { brand, model } = resolved;
  const path = `/japan/brand/${seoSlug(brand.name)}/${seoSlug(model.name)}`;
  const title = `${brand.name} ${model.name} из Японии`;
  const description = `${brand.name} ${model.name} с аукционов Японии: актуальные лоты, цены, фото, пробег, характеристики, статистика и расчёт ориентировочной стоимости.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: `${title} | MosaicAuto`,
      description,
    },
  };
}

export default async function JapanModelPage({ params }: { params: Params }) {
  const p = await params;
  const resolved = await resolveCollection(p.brand, p.model);
  if (!resolved) notFound();

  const { brand, model } = resolved;
  const brandPath = `/japan/brand/${seoSlug(brand.name)}`;
  const path = `${brandPath}/${seoSlug(model.name)}`;
  const catalog = await getJapanSeoCars(brand.name, model.name, 18);

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
          { name: brand.name, path: brandPath },
          { name: model.name, path },
        ])}
      />
      <SeoVehicleCollection
        market="japan"
        title={`${brand.name} ${model.name} из Японии`}
        description={`Актуальные аукционные автомобили ${brand.name} ${model.name}. На странице собраны доступные лоты с основными характеристиками; полный набор фильтров остаётся в каталоге.`}
        total={catalog.total}
        catalogHref={`/catalog?brand=${encodeURIComponent(brand.name)}&model=${encodeURIComponent(model.name)}`}
        calculatorHref="/calculator/japan"
        cars={catalog.items}
      />
    </>
  );
}
