import { NextResponse } from "next/server";
import { TextDecoder } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DetailRow = {
  label: string;
  value: string;
};

type DetailSection = {
  title: string;
  rows: DetailRow[];
};

function cleanParam(value: string | null) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

function decodeHtml(value: string) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
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

function cellText(cellHtml: string) {
  const withOptions = String(cellHtml || "")
    .replace(/<img[^>]+alt=["']Exist["'][^>]*>/gi, " Есть ")
    .replace(/<img[^>]+alt=["']Unknown["'][^>]*>/gi, " — ")
    .replace(/<img[^>]+alt=["']No["'][^>]*>/gi, " Нет ")
    .replace(/<img[^>]+src=["'][^"']*option1\.gif[^"']*["'][^>]*>/gi, " Есть ")
    .replace(/<img[^>]+src=["'][^"']*option2\.gif[^"']*["'][^>]*>/gi, " — ")
    .replace(/<img[^>]+src=["'][^"']*option0\.gif[^"']*["'][^>]*>/gi, " Нет ");

  return stripHtml(withOptions);
}

function extractCells(rowHtml: string): string[] {
  return Array.from(rowHtml.matchAll(/<td\b[\s\S]*?<\/td>/gi)).map((match) => match[0]);
}

function absoluteUrl(src: string) {
  const value = decodeHtml(src || "").trim();

  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `https://auc.mosaicauto.ru${value}`;

  return `https://auc.mosaicauto.ru/${value.replace(/^\/+/, "")}`;
}

function extractImage(html: string) {
  const images = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi))
    .map((match) => absoluteUrl(match[1] || ""))
    .filter(Boolean);

  return (
    images.find((src) => src.includes("/imgs/")) ||
    images.find((src) => src.includes("images/catalog/")) ||
    ""
  );
}

function extractTitle(html: string) {
  const links = Array.from(html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => stripHtml(match[1] || ""))
    .filter(Boolean)
    .filter((text) => !/home|logout|english|russian|japanese/i.test(text));

  const catalogIndex = links.findIndex((text) => /catalog|каталог/i.test(text));
  const crumbs = catalogIndex >= 0 ? links.slice(catalogIndex + 1, catalogIndex + 4) : links.slice(0, 4);

  const title = crumbs
    .join(" / ")
    .replace(/\s+/g, " ")
    .trim();

  if (title) return title;

  const text = stripHtml(html);
  return (
    text.match(/ALTO ECO\s*\/\s*ECO-S/i)?.[0] ||
    text.match(/[A-Z0-9 -]+\s*\/\s*[A-Z0-9 -]+/i)?.[0] ||
    ""
  ).trim();
}

function pushRow(sections: DetailSection[], sectionTitle: string, label: string, value: string) {
  const cleanLabel = label.replace(/:$/, "").trim();
  const cleanValue = value.trim();

  if (!cleanLabel || !cleanValue) return;
  if (cleanLabel.length > 120) return;
  if (cleanValue.length > 500) return;
  if (cleanLabel.toLowerCase() === cleanValue.toLowerCase()) return;

  let section = sections.find((item) => item.title === sectionTitle);

  if (!section) {
    section = { title: sectionTitle, rows: [] };
    sections.push(section);
  }

  const key = `${cleanLabel}|${cleanValue}`.toLowerCase();

  if (section.rows.some((row) => `${row.label}|${row.value}`.toLowerCase() === key)) {
    return;
  }

  section.rows.push({
    label: cleanLabel,
    value: cleanValue,
  });
}

function parseSections(html: string): DetailSection[] {
  const mainStart =
    html.search(/class=["']?aj_catalog/i) >= 0
      ? html.search(/class=["']?aj_catalog/i)
      : html.search(/header_cat/i);

  const scoped = mainStart >= 0 ? html.slice(Math.max(0, mainStart - 500)) : html;
  const rows = scoped.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];

  const sections: DetailSection[] = [];
  let currentSection = "Характеристики";

  for (const row of rows) {
    const cells = extractCells(row);
    if (!cells.length) continue;

    const texts = cells.map(cellText).filter(Boolean);
    if (!texts.length) continue;

    const isHeader =
      /header_cat/i.test(row) ||
      /class=["'][^"']*header/i.test(row) ||
      (texts.length === 1 && texts[0].length <= 80);

    if (isHeader) {
      const title = texts[0];

      if (
        title &&
        !/home|logout|guest|english|russian|japanese|list a|list b|list c|list d/i.test(title) &&
        title.length <= 80
      ) {
        currentSection = title;
      }

      continue;
    }

    if (texts.length >= 2) {
      pushRow(sections, currentSection, texts[0], texts.slice(1).join(" "));
    }
  }

  const blockedSectionTitle = /username|password|guest|logout|home|list a|list b|list c|list d/i;
  const blockedRow = /username|password|guest|logout/i;

  return sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => {
        if (blockedRow.test(row.label) || blockedRow.test(row.value)) return false;
        if (row.value === "\uf441") return false;
        return true;
      }),
    }))
    .filter((section) => section.rows.length > 0)
    .filter((section) => !blockedSectionTitle.test(section.title));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const mnfId = cleanParam(url.searchParams.get("mnf_id"));
    const mdlId = cleanParam(url.searchParams.get("mdl_id"));
    const rec = cleanParam(url.searchParams.get("rec"));

    if (!mnfId || !mdlId || !rec) {
      return NextResponse.json(
        {
          ok: false,
          error: "mnf_id, mdl_id and rec are required",
        },
        { status: 400 }
      );
    }

    const sourceUrl = new URL("https://auc.mosaicauto.ru/catalog");
    sourceUrl.searchParams.set("mnf_id", mnfId);
    sourceUrl.searchParams.set("mdl_id", mdlId);
    sourceUrl.searchParams.set("rec", rec);

    const res = await fetch(sourceUrl.toString(), {
      cache: "no-store",
      headers: {
        Accept: "text/html,*/*",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
        Cookie: "lang=ru",
        "User-Agent": "Mozilla/5.0 MosaicAuto/1.0",
      },
    });

    const buffer = Buffer.from(await res.arrayBuffer());
    const html = new TextDecoder("windows-1251").decode(buffer);

    const image = extractImage(html);
    const title = extractTitle(html);
    const sections = parseSections(html);

    return NextResponse.json({
      ok: true,
      source: "auc.mosaicauto.ru/catalog",
      mnfId,
      mdlId,
      rec,
      sourceUrl: sourceUrl.toString(),
      title,
      image,
      totalSections: sections.length,
      sections,
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
