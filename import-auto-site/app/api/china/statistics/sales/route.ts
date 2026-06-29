import { NextResponse } from "next/server";
import { getChinaCatalog, getChinaBrands, getChinaFacets } from "@/lib/china/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [catalog, brands, facets] = await Promise.all([
      getChinaCatalog({ page: 1, limit: 1 } as any),
      getChinaBrands(500),
      getChinaFacets(""),
    ]);

    const total = Number((catalog as any)?.total || 0);

    return NextResponse.json({
      ok: true,
      source: "china",
      market: "china",

      city: "BEIJING",
      cityLabel: "BEIJING",
      country: "Китай",
      countryLabel: "Китай",

      currency: "CNY",
      currencyLabel: "ЦБ РФ • 100 CNY",

      total,
      count: total,
      cars: total,
      lots: total,
      active: total,
      activeLots: total,
      carsTotal: total,
      totalCars: total,
      found: total,

      label: `${total.toLocaleString("ru-RU")} авто из Китая`,
      title: `${total.toLocaleString("ru-RU")} авто из Китая`,

      brands,
      brand: brands,
      makes: brands,
      marka: brands,
      markas: brands,

      facets,
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
