import { NextRequest, NextResponse } from "next/server";
import { savePurchaseLead } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const rateMap = new Map<string, { startedAt: number; count: number }>();

function text(value: unknown, max = 250) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function optionalInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizePhone(value: unknown) {
  const raw = text(value, 40);
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "";

  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }

  return raw.startsWith("+") ? `+${digits}` : digits;
}

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = rateMap.get(key);

  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    rateMap.set(key, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  rateMap.set(key, current);
  return current.count > RATE_MAX;
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    if (rateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Слишком много заявок. Попробуйте немного позже." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Некорректные данные формы." }, { status: 400 });
    }

    // Honeypot: bots often fill every field. Return success without storing spam.
    if (text((body as any).company, 100)) {
      return NextResponse.json({ ok: true, id: "accepted" });
    }

    const name = text((body as any).name, 100);
    const phone = normalizePhone((body as any).phone);

    if (name.length < 2) {
      return NextResponse.json({ ok: false, error: "Укажите имя." }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ ok: false, error: "Проверьте номер телефона." }, { status: 400 });
    }

    const saved = savePurchaseLead({
      source: text((body as any).source, 80) || "lot_purchase",
      name,
      phone,
      city: text((body as any).city, 120),
      comment: text((body as any).comment, 1200),
      country: text((body as any).country, 80),
      market: text((body as any).market, 40),
      lot: text((body as any).lot, 100),
      carId: text((body as any).carId, 120),
      brand: text((body as any).brand, 120),
      model: text((body as any).model, 160),
      year: optionalInt((body as any).year),
      priceForeign: text((body as any).priceForeign, 80),
      currency: text((body as any).currency, 12),
      calculatedTotalRub: optionalInt((body as any).calculatedTotalRub),
      pageUrl: text((body as any).pageUrl, 1000),
      visitorId: text((body as any).visitorId, 120),
      utmSource: text((body as any).utmSource, 200),
      utmMedium: text((body as any).utmMedium, 200),
      utmCampaign: text((body as any).utmCampaign, 250),
      utmContent: text((body as any).utmContent, 250),
      utmTerm: text((body as any).utmTerm, 250),
      referrer: text(req.headers.get("referer"), 1000),
      userAgent: text(req.headers.get("user-agent"), 500),
    });

    return NextResponse.json({
      ok: true,
      id: saved.id,
      createdAt: saved.createdAt,
    });
  } catch (error) {
    console.error("purchase lead save failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Не удалось сохранить заявку. Попробуйте ещё раз или свяжитесь с нами позже.",
      },
      { status: 500 }
    );
  }
}
