import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AvtoJpRow = Record<string, string | number | null | undefined>;

type FactoryItem = {
  image: string;
  release: string;
  modification: string;
  body: string;
  engine: string;
  drive: string;
  transmission: string;
  volume: string;
  power: string;
  fuel: string;
  price: string;
  rec: string;
};

function apiKey() {
  return (
    process.env.AVTOJP_API_KEY ||
    process.env.AJ_API_CODE ||
    process.env.AJ_CODE ||
    ""
  ).trim();
}

function apiBase() {
  return (
    process.env.AVTOJP_API_BASE_URL ||
    "http://87.242.72.57/api/"
  ).trim();
}

function cleanId(value: string) {
  return String(value || "")
    .trim()
    .replace(/^aj-/i, "")
    .replace(/\.htm$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function val(row: AvtoJpRow | null | undefined, key: string) {
  if (!row) return "";
  return String(row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()] ?? "").trim();
}

function sqlValue(value: unknown) {
  return String(value ?? "").replace(/'/g, "''");
}

function decodeHtml(value: string) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function stripHtml(value: string) {
  return decodeHtml(
    String(value || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unescapeJsString(value: string) {
  return String(value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function extractQ(raw: string) {
  const match =
    raw.match(/['"]q['"]\s*:\s*'([\s\S]*?)'\s*}\s*\)/) ||
    raw.match(/['"]q['"]\s*:\s*"([\s\S]*?)"\s*}\s*\)/);

  return match ? unescapeJsString(match[1]) : "";
}

function extractTitle(html: string) {
  const match = html.match(/<div[^>]*>\s*(Catalogue data|Данные каталога автомобилей)[\s\S]*?<\/div>/i);
  return match ? stripHtml(match[0]) : "";
}

function extractCells(rowHtml: string): string[] {
  return Array.from(rowHtml.matchAll(/<td\b[\s\S]*?<\/td>/gi)).map((match) => match[0]);
}
function extractImage(cellHtml: string) {
  const match = cellHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match) return "";

  const src = decodeHtml(match[1]);

  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `https://auc.mosaicauto.ru${src}`;

  return `https://auc.mosaicauto.ru/${src.replace(/^\/+/, "")}`;
}

function extractRec(cellHtml: string) {
  return cellHtml.match(/[?&]rec=(\d+)/i)?.[1] || "";
}

function extractRelease(cellText: string) {
  const match = cellText.match(/\d{2}\.\d{4}\s*-\s*(?:\.\.\.|…)?/);
  return match ? match[0].replace(/\s+/g, "") : cellText.trim();
}

function parseBookHtml(html: string): FactoryItem[] {
  const rows = html.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  const items: FactoryItem[] = [];

  let currentRelease = "";
  let currentImage = "";

  for (const row of rows) {
    if (/class\s*=\s*["']?t_header/i.test(row)) continue;
    if (/<td[^>]*class\s*=\s*["']?t_header/i.test(row)) continue;

    const rawCells = extractCells(row);
    if (rawCells.length < 9) continue;

    let dataCells: string[] = rawCells;
    const firstCell = rawCells[0] ?? "";
    const firstText = stripHtml(firstCell);

    if (/rowspan\s*=/i.test(firstCell) || /\d{2}\.\d{4}/.test(firstText)) {
      currentRelease = extractRelease(firstText);
      currentImage = extractImage(firstCell) || currentImage;
      dataCells = rawCells.slice(1);
    }

    if (dataCells.length < 9) continue;

    const clean = dataCells.map(stripHtml);

    const item: FactoryItem = {
      image: currentImage,
      release: currentRelease,
      modification: clean[0] || "",
      body: clean[1] || "",
      engine: clean[2] || "",
      drive: clean[3] || "",
      transmission: clean[4] || "",
      volume: clean[5] || "",
      power: clean[6] || "",
      fuel: clean[7] || "",
      price: clean[8] || "",
      rec: extractRec(dataCells[0] || ""),
    };

    if (item.modification || item.body || item.engine) {
      items.push(item);
    }
  }

  return items;
}

function mileageBucket(value: string) {
  const n = Number(String(value || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";

  if (n <= 25000) return "0-25";
  if (n <= 50000) return "25-50";
  if (n <= 75000) return "50-75";
  if (n <= 100000) return "75-100";
  if (n <= 150000) return "100-150";
  if (n <= 200000) return "150-200";

  return "200-";
}

async function avtojpQuery(sql: string): Promise<AvtoJpRow[]> {
  const key = apiKey();

  if (!key) {
    throw new Error("AVTOJP_API_KEY is not configured");
  }

  const url = new URL(apiBase());
  url.searchParams.set("ip", process.env.AVTOJP_API_IP || "8.1.1.1");
  url.searchParams.set("json", "");
  url.searchParams.set("code", key);
  url.searchParams.set("sql", sql);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "MosaicAuto/1.0",
    },
  });

  const raw = (await res.text()).replace(/\0/g, "").trim();
  const startPositions = [raw.indexOf("["), raw.indexOf("{")].filter((i) => i >= 0);
  const start = startPositions.length ? Math.min(...startPositions) : -1;
  const clean = start >= 0 ? raw.slice(start) : raw;

  const parsed = JSON.parse(clean);

  if (Array.isArray(parsed)) return parsed as AvtoJpRow[];

  if (parsed && typeof parsed === "object" && "error" in parsed) {
    throw new Error(String((parsed as { error?: unknown }).error || "AVTOJP error"));
  }

  return [];
}

async function findLot(id: string) {
  const mainRows = await avtojpQuery(`select * from main where id='${sqlValue(id)}' limit 1`);
  if (mainRows[0]) return { row: mainRows[0], source: "main" };

  const statsRows = await avtojpQuery(`select * from stats where id='${sqlValue(id)}' limit 1`);
  if (statsRows[0]) return { row: statsRows[0], source: "stats" };

  return null;
}

async function fetchBook(lot: AvtoJpRow) {
  const url = new URL("https://auc.mosaicauto.ru/vw");

  url.searchParams.set("file", "loader");
  url.searchParams.set("op", "book");
  url.searchParams.set("id", val(lot, "ID"));
  url.searchParams.set("manuf_name", val(lot, "MARKA_NAME"));
  url.searchParams.set("model_name", val(lot, "MODEL_NAME"));
  url.searchParams.set("manuf_id", val(lot, "MARKA_ID"));
  url.searchParams.set("model_id", val(lot, "MODEL_ID"));
  url.searchParams.set("year", val(lot, "YEAR"));
  url.searchParams.set("year_mem", val(lot, "YEAR"));
  url.searchParams.set("rate", val(lot, "RATE"));
  url.searchParams.set("kuzov", "0");
  url.searchParams.set("kuzov_mem", val(lot, "KUZOV"));
  url.searchParams.set("grade", val(lot, "GRADE"));
  url.searchParams.set("probeg", mileageBucket(val(lot, "MILEAGE")));
  url.searchParams.set("eng_code_hist", "");
  url.searchParams.set("probeg_hist", val(lot, "MILEAGE"));
  url.searchParams.set("eng_v_hist", val(lot, "ENG_V"));
  url.searchParams.set("colour_hist", val(lot, "COLOR"));
  url.searchParams.set("price_finish", val(lot, "FINISH"));

  const referer = `https://auc.mosaicauto.ru/aj-${val(lot, "ID")}.htm`;

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Accept: "*/*",
      Referer: referer,
      "User-Agent": "Mozilla/5.0 MosaicAuto/1.0",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const raw = await res.text();
  const html = extractQ(raw);

  return {
    requestUrl: url.toString(),
    status: res.status,
    rawPreview: raw.slice(0, 500),
    html,
    title: extractTitle(html),
    items: parseBookHtml(html),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = cleanId(params.id);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const found = await findLot(id);

    if (!found) {
      return NextResponse.json(
        { ok: false, id, error: "lot not found in AVTO.JP main/stats" },
        { status: 404 }
      );
    }

    const book = await fetchBook(found.row);

    return NextResponse.json({
      ok: true,
      source: "avtojp-api + auc.mosaicauto.ru book",
      exactFactoryCatalog: true,
      id,
      lotSource: found.source,
      lot: {
        id: val(found.row, "ID"),
        lot: val(found.row, "LOT"),
        auction: val(found.row, "AUCTION"),
        auctionDate: val(found.row, "AUCTION_DATE"),
        brand: val(found.row, "MARKA_NAME"),
        model: val(found.row, "MODEL_NAME"),
        markaId: val(found.row, "MARKA_ID"),
        modelId: val(found.row, "MODEL_ID"),
        year: val(found.row, "YEAR"),
        body: val(found.row, "KUZOV"),
        grade: val(found.row, "GRADE"),
        mileage: val(found.row, "MILEAGE"),
        engineCc: val(found.row, "ENG_V"),
        power: val(found.row, "PW"),
        transmission: val(found.row, "KPP"),
        drive: val(found.row, "PRIV"),
        finish: val(found.row, "FINISH"),
      },
      title: book.title,
      total: book.items.length,
      items: book.items,
      debug: {
        bookStatus: book.status,
        hasHtml: Boolean(book.html),
        rawPreview: book.rawPreview,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
