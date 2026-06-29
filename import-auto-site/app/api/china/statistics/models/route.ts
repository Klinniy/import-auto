import { NextRequest, NextResponse } from "next/server";
import { getChinaModels } from "@/lib/china/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;

  for (const key of ["items", "data", "models", "model", "rows", "result", "results"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  return [];
}

function normalizeItem(item: any) {
  if (typeof item === "string") {
    return { id: item, name: item, label: item, value: item, count: null };
  }

  const name =
    item?.name ??
    item?.model ??
    item?.title ??
    item?.label ??
    item?.value ??
    item?.id ??
    "";

  return {
    ...item,
    id: item?.id ?? name,
    name,
    label: item?.label ?? name,
    value: item?.value ?? name,
    count: item?.count ?? item?.total ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const brand =
      req.nextUrl.searchParams.get("brand") ||
      req.nextUrl.searchParams.get("marka") ||
      req.nextUrl.searchParams.get("makerName") ||
      "";

    const raw = await getChinaModels(brand, 500);
    const items = toArray(raw).map(normalizeItem).filter((x) => String(x.name || "").trim());

    return NextResponse.json({
      ok: true,
      source: "china",
      market: "china",
      brand,
      total: items.length,
      items,
      data: items,
      models: items,
      model: items,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, source: "china", error: String(error) },
      { status: 500 }
    );
  }
}
