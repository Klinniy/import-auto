import { NextRequest, NextResponse } from "next/server";
import { getChinaBrands, getChinaModels, getChinaFacets } from "@/lib/china/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function arr(value: any): any[] {
  if (Array.isArray(value)) return value;

  for (const key of [
    "items",
    "data",
    "rows",
    "result",
    "results",
    "brands",
    "brand",
    "models",
    "model",
  ]) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  return [];
}

export async function GET(req: NextRequest) {
  try {
    const brand =
      req.nextUrl.searchParams.get("brand") ||
      req.nextUrl.searchParams.get("marka") ||
      req.nextUrl.searchParams.get("makerName") ||
      "";

    const [brandsRaw, modelsRaw, facetsRaw] = await Promise.all([
      getChinaBrands(500),
      getChinaModels(brand || undefined, 500),
      getChinaFacets(brand || undefined),
    ]);

    const brands = arr(brandsRaw);
    const models = arr(modelsRaw);
    const facets: any = facetsRaw || {};

    const bodies = arr(facets.bodies || facets.body || facets.kuzov || facets.kuzovs);
    const colors = arr(facets.colors || facets.color || facets.colours);
    const transmissions = arr(facets.transmissions || facets.transmission || facets.kpp || facets.kpps);
    const drives = arr(facets.drives || facets.drive || facets.priv);
    const grades = arr(facets.grades || facets.grade || facets.rates || facets.rating || facets.ratings || facets.scores);
    const auctions = arr(facets.auctions || facets.auction);
    const statuses = arr(facets.statuses || facets.status);

    return NextResponse.json({
      ok: true,
      source: "china",
      market: "china",

      brands,
      brand: brands,
      makes: brands,
      marka: brands,
      markas: brands,

      models,
      model: models,

      bodies,
      body: bodies,
      kuzov: bodies,
      kuzovs: bodies,

      colors,
      color: colors,
      colours: colors,

      transmissions,
      transmission: transmissions,
      kpp: transmissions,
      kpps: transmissions,

      drives,
      drive: drives,
      priv: drives,

      grades,
      grade: grades,
      rates: grades,
      rating: grades,
      ratings: grades,
      scores: grades,

      auctions,
      auction: auctions,

      statuses,
      status: statuses,

      sortOptions: [
        { value: "", label: "По умолчанию" },
        { value: "dateDesc", label: "Дата ↓" },
        { value: "dateAsc", label: "Дата ↑" },
        { value: "lotAsc", label: "Номер лота ↑" },
        { value: "lotDesc", label: "Номер лота ↓" },
        { value: "yearDesc", label: "Год ↓" },
        { value: "yearAsc", label: "Год ↑" },
        { value: "mileageAsc", label: "Пробег ↑" },
        { value: "mileageDesc", label: "Пробег ↓" },
        { value: "priceAsc", label: "Цена ↑" },
        { value: "priceDesc", label: "Цена ↓" }
      ],

      debugCounts: {
        brands: brands.length,
        models: models.length,
        bodies: bodies.length,
        colors: colors.length,
        transmissions: transmissions.length,
        drives: drives.length,
        grades: grades.length,
        auctions: auctions.length,
        statuses: statuses.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "china",
        market: "china",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
