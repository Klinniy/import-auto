import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(origin + "/api/debug?smoke=1", {
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      ok: data.ok,
      version: data.version,
      checkedAt: data.checkedAt,
      server: data.server,
      env: data.env,
      git: data.git,
      routes: data.routes,
      smoke: data.smoke,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        version: "DEBUG CENTER V2",
        checkedAt: new Date().toISOString(),
        error: String(error),
      },
      { status: 500 }
    );
  }
}
