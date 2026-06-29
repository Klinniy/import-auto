import { NextRequest, NextResponse } from "next/server";
import { calculateImport } from "../_shared/calc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(calculateImport("japan", body));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Ошибка расчёта" },
      { status: 500 }
    );
  }
}
