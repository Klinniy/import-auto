import { NextRequest, NextResponse } from "next/server";
import {
  getChinaBrands,
  getChinaCatalog,
  getChinaFacets,
  getChinaModels,
} from "@/lib/china/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function one(params: URLSearchParams, key: string) {
  return params.get(key) || "";
}

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;

    const data = await getChinaCatalog({
      page: Number(one(p, "page") || 1),
      limit: Number(one(p, "limit") || 24),
      brand: one(p, "brand"),
      model: one(p, "model"),
      lot: one(p, "lot"),
      yearFrom: one(p, "yearFrom"),
      yearTo: one(p, "yearTo"),
      mileageTo: one(p, "mileageTo"),
      engineFrom: one(p, "engineFrom"),
      engineTo: one(p, "engineTo"),
      priceFrom: one(p, "priceFrom"),
      priceTo: one(p, "priceTo"),
      body: one(p, "body"),
      color: one(p, "color"),
      transmission: one(p, "transmission"),
      drive: one(p, "drive"),
      sort: one(p, "sort"),
    });

    if (one(p, "facets") !== "1") {
      return NextResponse.json(data);
    }

    const brand = one(p, "brand");

    const [brands, models, facets] = await Promise.all([
      getChinaBrands(),
      getChinaModels(brand),
      getChinaFacets(brand),
    ]);

    return NextResponse.json({
      ...data,
      facets: {
        brands,
        models,
        ...facets,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
