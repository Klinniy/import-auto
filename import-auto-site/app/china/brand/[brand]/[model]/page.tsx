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

type Params = Promise<{ brand: string; model: string }> | { brand: string; model: string };

async function resolveCollection(brandSlug: string, modelSlug: string) {
  const brands = await getChinaSeoBrands();
  const brand = resolveSeoItem(brands, brandSlug);
  if (!brand) return null;

  const models = await getChinaSeoModels(brand.name);
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
  const path = `/china/brand/${seoSlug(brand.name)}/${seoSlug(model.name)}`;
  const title = `${brand.name} ${model.name} из Китая`;
  const description = `${brand.name} ${model.name} из Китая: актуальные автомобили, цены, фото, характеристики и расчёт ориентировочной итоговой стоимости с доставкой.`;

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

export default async function ChinaModelPage({ params }: { params: Params }) {
  const p = await params;
  const resolved = await resolveCollection(p.brand, p.model);
  if (!resolved) notFound();

  const { brand, model } = resolved;
  const brandPath = `/china/brand/${seoSlug(brand.name)}`;
  const path = `${brandPath}/${seoSlug(model.name)}`;
  const catalog = await getChinaSeoCars(brand.name, model.name, 18);

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Китая", path: "/china" },
          { name: brand.name, path: brandPath },
          { name: model.name, path },
        ])}
      />
      <SeoVehicleCollection
        market="china"
        title={`${brand.name} ${model.name} из Китая`}
        description={`Актуальные предложения ${brand.name} ${model.name} из Китая. Здесь собраны доступные автомобили с основными характеристиками; полный набор фильтров остаётся в каталоге.`}
        total={catalog.total}
        catalogHref={`/china?brand=${encodeURIComponent(brand.name)}&model=${encodeURIComponent(model.name)}`}
        calculatorHref="/calculator/china"
        cars={catalog.items}
      />
    </>
  );
}
