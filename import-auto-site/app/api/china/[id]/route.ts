import { NextResponse } from "next/server";
import { getChinaLot } from "@/lib/china/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function responsePayload(item: any) {
  const { source, ...payload } = item || {};

  return {
    ...payload,
    ok: true,
    source: source || "china",
    item,
    car: item,
    data: item,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const id = String(params?.id || "");

    const item = await getChinaLot(id);

    if (!item) {
      return NextResponse.json(
        {
          ok: false,
          error: "Лот не найден",
          id,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(responsePayload(item));
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
