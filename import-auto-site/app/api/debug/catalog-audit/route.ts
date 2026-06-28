import { NextResponse } from "next/server";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    if (existsSync("scripts/catalog-audit.mjs")) {
      execFileSync("node", ["scripts/catalog-audit.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 60000,
      });
    }

    if (!existsSync("public/catalog-audit.json")) {
      return NextResponse.json({
        ok: false,
        error: "catalog-audit.json not found. scripts/catalog-audit.mjs was not created or failed.",
      }, { status: 500 });
    }

    const raw = readFileSync("public/catalog-audit.json", "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
    }, { status: 500 });
  }
}
