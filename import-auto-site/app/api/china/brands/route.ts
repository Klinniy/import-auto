import { NextResponse } from "next/server";
import { getChinaBrands } from "@/lib/china/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;

  for (const key of ["items", "data", "brands", "brand", "makes", "marka", "markas", "rows", "result", "results"]) {
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
    item?.brand ??
    item?.make ??
    item?.maker ??
    item?.marka ??
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

export async function GET() {
  try {
    const raw = await getChinaBrands(500);
    const items = toArray(raw).map(normalizeItem).filter((x) => String(x.name || "").trim());

    return NextResponse.json({
      ok: true,
      source: "china",
      market: "china",
      total: items.length,
      items,
      data: items,
      brands: items,
      brand: items,
      makes: items,
      marka: items,
      markas: items,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, source: "china", error: String(error) },
      { status: 500 }
    );
  }
}
