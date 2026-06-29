import { NextRequest, NextResponse } from "next/server";
import { getBrandsDictionary } from "@/lib/catalog/dictionaries";

function normalizeAnyParam(value: unknown): string {
  const text = String(value ?? "").trim();

  if (!text) return "";
  if (text === "__any__") return "";
  if (text === "_any_") return "";
  if (text.toLowerCase() === "any") return "";
  if (text.toLowerCase() === "all") return "";
  if (text.toLowerCase() === "undefined") return "";
  if (text.toLowerCase() === "null") return "";
  if (text === "Любая") return "";
  if (text === "Любая марка") return "";
  if (text === "Любая модель") return "";

  return text;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const debug = req.nextUrl.searchParams.get("debug") === "1";
    const data = await getBrandsDictionary(debug);

    return NextResponse.json(data);
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
