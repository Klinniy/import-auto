import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { getCrmClient, saveCrmClientFile } from "@/lib/crm/client-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".webp",
  ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".zip",
]);

type Params = Promise<{ phone: string }> | { phone: string };

function safeName(value: string) {
  return path.basename(value).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "document";
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);
  if (!getCrmClient(phone)) return NextResponse.json({ ok: false, error: "Клиент не найден" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Выберите файл" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: "Файл должен быть не больше 25 МБ" }, { status: 400 });
  }

  const originalName = safeName(file.name);
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({
      ok: false,
      error: "Разрешены PDF, изображения, Word, Excel, CSV, TXT и ZIP",
    }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const saved = saveCrmClientFile(phone, {
    originalName,
    mimeType: String(file.type || "application/octet-stream").slice(0, 160),
    data,
  });

  return NextResponse.json({ ok: true, file: saved });
}
