import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CatalogItem = {
  id?: string;
  lot?: string;
  brand?: string;
  model?: string;
  images?: unknown;
  previewImage?: string;
  [key: string]: unknown;
};

type CatalogResponse = {
  ok?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  items?: CatalogItem[];
  error?: string;
};

const memoryCache = new Map<string, { at: number; data: CatalogItem | null }>();
const CACHE_TTL_MS = 1000 * 60 * 10;

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("host");

  if (host) {
    return `http://${host}`;
  }

  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

function sameId(item: CatalogItem, id: string) {
  return String(item?.id || "") === id;
}

async function fetchCatalogPage(baseUrl: string, page: number, limit: number) {
  const url = `${baseUrl}/api/catalog?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  const json = (await res.json()) as CatalogResponse;

  return {
    ok: res.ok && json?.ok !== false,
    status: res.status,
    json,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cleanId = String(id || "").trim();

  if (!cleanId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing lot id",
      },
      { status: 400 }
    );
  }

  const cached = memoryCache.get(cleanId);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({
      ok: true,
      id: cleanId,
      source: "catalog-scan-cache",
      data: cached.data,
    });
  }

  const baseUrl = getBaseUrl(req);
  const requestedLimit = 500;

  const first = await fetchCatalogPage(baseUrl, 1, requestedLimit);

  if (!first.ok) {
    return NextResponse.json(
      {
        ok: false,
        id: cleanId,
        source: "catalog-scan",
        error: first.json?.error || "Catalog request failed",
        status: first.status,
      },
      { status: 500 }
    );
  }

  const firstItems = Array.isArray(first.json.items) ? first.json.items : [];
  const foundOnFirst = firstItems.find((item) => sameId(item, cleanId));

  if (foundOnFirst) {
    memoryCache.set(cleanId, { at: Date.now(), data: foundOnFirst });

    return NextResponse.json({
      ok: true,
      id: cleanId,
      source: "catalog-scan",
      scan: {
        page: 1,
        limit: first.json.limit,
        total: first.json.total,
        pages: first.json.pages,
      },
      data: foundOnFirst,
    });
  }

  const pages = Math.max(1, Number(first.json.pages || 1));
  const maxPages = Math.min(pages, 600);

  for (let page = 2; page <= maxPages; page += 1) {
    const result = await fetchCatalogPage(baseUrl, page, requestedLimit);

    if (!result.ok) continue;

    const items = Array.isArray(result.json.items) ? result.json.items : [];
    const found = items.find((item) => sameId(item, cleanId));

    if (found) {
      memoryCache.set(cleanId, { at: Date.now(), data: found });

      return NextResponse.json({
        ok: true,
        id: cleanId,
        source: "catalog-scan",
        scan: {
          page,
          limit: result.json.limit,
          total: result.json.total,
          pages: result.json.pages,
        },
        data: found,
      });
    }
  }

  memoryCache.set(cleanId, { at: Date.now(), data: null });

  return NextResponse.json({
    ok: true,
    id: cleanId,
    source: "catalog-scan",
    data: null,
    scan: {
      searchedPages: maxPages,
      requestedLimit,
      total: first.json.total,
      pages: first.json.pages,
    },
  });
}
