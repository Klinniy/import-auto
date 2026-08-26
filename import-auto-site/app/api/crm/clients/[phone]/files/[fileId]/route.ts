import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { deleteCrmClientFile, readCrmClientFile } from "@/lib/crm/client-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ phone: string; fileId: string }> | { phone: string; fileId: string };

export async function GET(req: NextRequest, { params }: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) return new NextResponse("Not found", { status: 404 });
  const { phone: rawPhone, fileId } = await params;
  const phone = decodeURIComponent(rawPhone);
  const file = readCrmClientFile(phone, fileId);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(file.data, {
    headers: {
      "content-type": file.mimeType || "application/octet-stream",
      "content-length": String(file.sizeBytes),
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "cache-control": "private, no-store, max-age=0",
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  const { phone: rawPhone, fileId } = await params;
  const phone = decodeURIComponent(rawPhone);
  const deleted = deleteCrmClientFile(phone, fileId);
  if (!deleted) return NextResponse.json({ ok: false, error: "Файл не найден" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
