import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type SaleItem = {
  id?: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: number;
  body?: string;
  auction?: string;
  auctionDate?: string;
  grade?: string;
  rate?: string;
  color?: string;
  transmission?: string;
  drive?: string;
  mileage?: number;
  engineVolume?: number;
  startPrice?: number;
  finishPrice?: number;
  averagePrice?: number;
};

type SalesPayload = {
  ok?: boolean;
  total?: number;
  items?: SaleItem[];
};

type GroupStat = {
  key: string;
  count: number;
  avgPrice: number;
};

type Bucket = {
  key: string;
  label: string;
  min: number;
  max: number | null;
};

type HrefParams = Record<string, string | undefined>;

const RATE_ORDER = [
  "X",
  "S",
  "RB",
  "RA",
  "R",
  "N",
  "99",
  "6",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2",
  "1",
  "0",
  "-",
  "***",
];

const MILEAGE_BUCKETS: Bucket[] = [
  { key: "0-25", label: "0-25", min: 0, max: 25000 },
  { key: "25-50", label: "25-50", min: 25001, max: 50000 },
  { key: "50-75", label: "50-75", min: 50001, max: 75000 },
  { key: "75-100", label: "75-100", min: 75001, max: 100000 },
  { key: "100-125", label: "100-125", min: 100001, max: 125000 },
  { key: "125-150", label: "125-150", min: 125001, max: 150000 },
  { key: ">150", label: ">150", min: 150001, max: null },
];

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function first(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return clean(value[0]);
  return clean(value);
}

function toNum(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function fmtNum(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return new Intl.NumberFormat("ru-RU").format(num).replace(/\u202f/g, " ");
}

function fmtYen(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return fmtNum(num);
}

function avg(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

function parseDate(value: unknown) {
  const raw = clean(value);
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : 0;
}

function formatAuctionDate(value: unknown) {
  const raw = clean(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  return raw.slice(0, 10) || "—";
}

function soldOnly(items: SaleItem[]) {
  return items.filter((item) => toNum(item.finishPrice) > 0);
}

function makeApiParams(source: {
  brand: string;
  model: string;
  body?: string;
}) {
  const params = new URLSearchParams();

  if (source.brand) params.set("brand", source.brand);
  if (source.model) params.set("model", source.model);
  if (source.body) params.set("body", source.body);

  params.set("page", "1");
  params.set("limit", "1200");
  params.set("sort", "auction_desc");

  return params;
}

async function fetchSales(origin: string, params: URLSearchParams) {
  const response = await fetch(`${origin}/api/statistics/sales?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({
    ok: false,
    items: [],
    total: 0,
  }))) as SalesPayload;

  return {
    total: Number(payload.total || 0),
    items: Array.isArray(payload.items) ? payload.items : [],
  };
}

function inMileage(item: SaleItem, key: string) {
  if (!key) return true;

  const bucket = MILEAGE_BUCKETS.find((entry) => entry.key === key);
  if (!bucket) return true;

  const km = toNum(item.mileage);

  if (bucket.max === null) {
    return km >= bucket.min;
  }

  return km >= bucket.min && km <= bucket.max;
}

function groupBy(items: SaleItem[], keyGetter: (item: SaleItem) => string): GroupStat[] {
  const map = new Map<string, SaleItem[]>();

  for (const item of items) {
    const key = clean(keyGetter(item));
    if (!key) continue;

    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, rows]) => ({
      key,
      count: rows.length,
      avgPrice: avg(rows.map((row) => toNum(row.finishPrice))),
    }))
    .sort((a, b) => {
      const an = Number(a.key);
      const bn = Number(b.key);

      if (Number.isFinite(an) && Number.isFinite(bn)) return bn - an;

      const ai = RATE_ORDER.indexOf(a.key);
      const bi = RATE_ORDER.indexOf(b.key);

      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }

      return a.key.localeCompare(b.key);
    });
}

function avgFor(items: SaleItem[], rate: string, mileage?: string) {
  const rows = items.filter((item) => {
    if (clean(item.rate) !== rate) return false;
    if (mileage && !inMileage(item, mileage)) return false;
    return true;
  });

  return avg(rows.map((item) => toNum(item.finishPrice)));
}

function countFor(items: SaleItem[], rate: string, mileage?: string) {
  return items.filter((item) => {
    if (clean(item.rate) !== rate) return false;
    if (mileage && !inMileage(item, mileage)) return false;
    return true;
  }).length;
}

function buildHref(base: HrefParams, patch: HrefParams = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...base, ...patch })) {
    const cleanValue = clean(value);
    if (!cleanValue) continue;
    params.set(key, cleanValue);
  }

  return `/catalog/sales-stats?${params.toString()}`;
}

function YearTable({
  items,
  selectedYear,
  baseHref,
}: {
  items: GroupStat[];
  selectedYear: string;
  baseHref: HrefParams;
}) {
  const avgMax = Math.max(...items.map((item) => item.avgPrice), 1);
  const countMax = Math.max(...items.map((item) => item.count), 1);

  return (
    <table className="auc-year-table" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td className="auc-head">Год</td>
          <td className="auc-head">Средняя&nbsp;цена&nbsp;¥</td>
        </tr>

        {items.map((item, index) => {
          const active = item.key === selectedYear;
          const avgWidth = Math.max(4, Math.round((item.avgPrice / avgMax) * 100));
          const countWidth = Math.max(4, Math.round((item.count / countMax) * 100));

          return (
            <tr key={item.key} className={index % 2 ? "auc-row-dark" : "auc-row-light"}>
              <td className={active ? "auc-year active" : "auc-year"}>
                <a href={buildHref(baseHref, { statYear: item.key })}>{item.key}</a>
              </td>

              <td className={active ? "auc-year-price active" : "auc-year-price"}>
                <a href={buildHref(baseHref, { statYear: item.key })}>
                  <span className="auc-year-count" style={{ width: `${countWidth}%` }} />
                  <span className="auc-year-bar" style={{ width: `${avgWidth}%` }} />
                  <span className="auc-year-value">{fmtYen(item.avgPrice)}</span>
                </a>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MatrixCell({
  price,
  count,
  maxPrice,
  maxCount,
  href,
  active,
}: {
  price: number;
  count: number;
  maxPrice: number;
  maxCount: number;
  href: string;
  active?: boolean;
}) {
  if (!price || !count) {
    return <td className="auc-matrix-empty" />;
  }

  const priceHeight = Math.max(10, Math.round((price / maxPrice) * 46));
  const countHeight = Math.max(8, Math.round((count / maxCount) * 46));

  return (
    <td className={active ? "auc-matrix-cell active" : "auc-matrix-cell"}>
      <a href={href}>
        <span className="auc-matrix-price">{fmtYen(price)}</span>
        <span className="auc-matrix-count-bar" style={{ height: `${countHeight}px` }} />
        <span className="auc-matrix-price-bar" style={{ height: `${priceHeight}px` }} />
      </a>
    </td>
  );
}

function MatrixTable({
  items,
  selectedRate,
  selectedMileage,
  baseHref,
}: {
  items: SaleItem[];
  selectedRate: string;
  selectedMileage: string;
  baseHref: HrefParams;
}) {
  const rates = groupBy(items, (item) => clean(item.rate))
    .map((item) => item.key)
    .filter(Boolean)
    .sort((a, b) => {
      const ai = RATE_ORDER.indexOf(a);
      const bi = RATE_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const allPrices: number[] = [];
  const allCounts: number[] = [];

  for (const rate of rates) {
    for (const bucket of MILEAGE_BUCKETS) {
      allPrices.push(avgFor(items, rate, bucket.key));
      allCounts.push(countFor(items, rate, bucket.key));
    }

    allPrices.push(avgFor(items, rate));
    allCounts.push(countFor(items, rate));
  }

  const maxPrice = Math.max(...allPrices, 1);
  const maxCount = Math.max(...allCounts, 1);

  return (
    <table className="auc-matrix-table" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td className="auc-head auc-rate-head">Оценка</td>

          {MILEAGE_BUCKETS.map((bucket) => (
            <td
              key={bucket.key}
              className={bucket.key === selectedMileage ? "auc-head active" : "auc-head"}
            >
              <a href={buildHref(baseHref, { statMileage: bucket.key })}>
                {bucket.label}
                <br />
                <span>тыс.км</span>
              </a>
            </td>
          ))}

          <td className={!selectedMileage ? "auc-head active" : "auc-head"}>
            <a href={buildHref(baseHref, { statMileage: undefined })}>
              Средняя&nbsp;цена&nbsp;¥
              <br />
              Любой&nbsp;пробег&nbsp;тыс.км
            </a>
          </td>
        </tr>

        {rates.map((rate, index) => (
          <tr key={rate} className={index % 2 ? "auc-row-dark" : "auc-row-light"}>
            <td className={rate === selectedRate ? "auc-rate active" : "auc-rate"}>
              <a href={buildHref(baseHref, { statRate: rate })}>{rate}</a>
            </td>

            {MILEAGE_BUCKETS.map((bucket) => (
              <MatrixCell
                key={`${rate}-${bucket.key}`}
                price={avgFor(items, rate, bucket.key)}
                count={countFor(items, rate, bucket.key)}
                maxPrice={maxPrice}
                maxCount={maxCount}
                href={buildHref(baseHref, {
                  statRate: rate,
                  statMileage: bucket.key,
                })}
                active={rate === selectedRate && bucket.key === selectedMileage}
              />
            ))}

            <MatrixCell
              price={avgFor(items, rate)}
              count={countFor(items, rate)}
              maxPrice={maxPrice}
              maxCount={maxCount}
              href={buildHref(baseHref, {
                statRate: rate,
                statMileage: undefined,
              })}
              active={rate === selectedRate && !selectedMileage}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SaleRow({ item, index }: { item: SaleItem; index: number }) {
  return (
    <tr className={index % 2 ? "auc-row-dark" : "auc-row-light"}>
      <td className="auc-lot">
        <a href="#">
          <b>{item.lot || "—"}</b>
        </a>
        <span>{item.auction || "—"}</span>
      </td>

      <td className="auc-date">{formatAuctionDate(item.auctionDate)}</td>

      <td className="auc-engine">
        <b>{item.engineVolume || "—"}</b>
        <span>{clean(item.model)}</span>
      </td>

      <td className="auc-body">
        <b>{item.body || "—"}</b>
        <span>{item.drive || ""}</span>
      </td>

      <td className="auc-grade">
        <b>
          {item.transmission || "—"} {item.drive || ""}
        </b>
        <span>{item.grade || "—"}</span>
      </td>

      <td className="auc-mileage">{fmtNum(item.mileage)}</td>

      <td className="auc-rate-score">{item.rate || "—"}</td>

      <td className="auc-price">
        <span>{fmtYen(item.startPrice)} ¥</span>
        <b>{fmtYen(item.finishPrice)} ¥</b>
      </td>

      <td className="auc-color">{item.color || ""}</td>
    </tr>
  );
}

export default async function SalesStatsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const brand = first(params, "brand") || first(params, "marka") || first(params, "markaName");
  const model = first(params, "model") || first(params, "modelName");
  const body = first(params, "body") || first(params, "kuzov") || first(params, "chassis");

  const requestedYearFrom = first(params, "yearFrom") || first(params, "year");
  const requestedYearTo = first(params, "yearTo") || first(params, "year");

  const statYear = first(params, "statYear");
  const statRate = first(params, "statRate");
  const statMileage = first(params, "statMileage") || first(params, "statProbeg");
  const statBody = first(params, "statBody");

  const showAll = first(params, "showAll") === "1";

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "mosaicauto.ru";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  /*
    Важно:
    API-запрос делаем по brand + model без body.
    Иначе список кузовов в фильтре будет зажат текущим кузовом,
    а старая статистика auc показывает все кузова модели.
  */
  const apiParams = makeApiParams({ brand, model });
  const sales = await fetchSales(origin, apiParams);

  const allSold = soldOnly(sales.items).sort((a, b) => parseDate(b.auctionDate) - parseDate(a.auctionDate));

  const bodyGroups = groupBy(allSold, (item) => clean(item.body));
  const selectedBody = statBody || body || bodyGroups[0]?.key || "";

  const bodyScoped = selectedBody
    ? allSold.filter((item) => clean(item.body) === selectedBody)
    : allSold;

  const yearGroups = groupBy(bodyScoped, (item) => String(item.year || ""))
    .filter((item) => item.key)
    .sort((a, b) => Number(b.key) - Number(a.key));

  const selectedYear = statYear || requestedYearFrom || yearGroups[0]?.key || "";

  const yearScoped = selectedYear
    ? bodyScoped.filter((item) => String(item.year || "") === selectedYear)
    : bodyScoped;

  const rateGroups = groupBy(yearScoped, (item) => clean(item.rate))
    .filter((item) => item.key)
    .sort((a, b) => {
      const ai = RATE_ORDER.indexOf(a.key);
      const bi = RATE_ORDER.indexOf(b.key);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const selectedRate = statRate;
  const selectedMileage = statMileage;

  const filteredRows = yearScoped.filter((item) => {
    if (selectedRate && clean(item.rate) !== selectedRate) return false;
    if (selectedMileage && !inMileage(item, selectedMileage)) return false;
    return true;
  });

  const avgFiltered = avg(filteredRows.map((item) => toNum(item.finishPrice)));
  const visibleRows = showAll ? filteredRows.slice(0, 49) : filteredRows.slice(0, 10);

  const baseHref: HrefParams = {
    brand,
    model,
    body,
    yearFrom: requestedYearFrom,
    yearTo: requestedYearTo,
    statYear: selectedYear,
    statRate: selectedRate,
    statMileage: selectedMileage,
    statBody: selectedBody,
  };

  return (
    <main className="auc-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .auc-page {
              min-height: 100vh;
              background: #ffffff;
              color: #07152f;
              font-family: Tahoma, Arial, sans-serif;
              padding: 10px 0 40px 28px;
            }

            .auc-wrap {
              width: 910px;
              max-width: calc(100vw - 40px);
            }

            .auc-top {
              display: flex;
              gap: 6px;
              margin-bottom: 12px;
            }

            .auc-top a {
              height: 18px;
              line-height: 17px;
              display: inline-block;
              padding: 0 11px;
              border-radius: 3px;
              color: #fff;
              font-size: 13px;
              text-decoration: none;
              font-weight: 700;
            }

            .auc-back {
              background: #959bae;
            }

            .auc-home {
              background: #07152f;
            }

            .auc-title {
              margin: 0 0 8px 0;
              font-size: 15px;
              line-height: 1.2;
              font-weight: 400;
              color: #222;
            }

            .auc-filter {
              width: 840px;
              max-width: 100%;
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;
              font-size: 13px;
              white-space: nowrap;
            }

            .auc-filter label {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-weight: 700;
            }

            .auc-filter span {
              font-weight: 400;
            }

            .auc-filter select {
              height: 21px;
              border: 1px solid #93a3bc;
              background: #fff;
              font-size: 12px;
              font-family: Arial, sans-serif;
              padding: 0 2px;
            }

            .auc-filter button {
              height: 21px;
              padding: 0 18px;
              border: 0;
              background: linear-gradient(#7dc4ff, #3188df);
              color: #fff;
              font-size: 12px;
              font-family: Tahoma, Arial, sans-serif;
              cursor: pointer;
            }

            .auc-avg {
              margin-left: auto;
              color: #444;
              font-size: 13px;
              font-weight: 400;
            }

            .auc-avg b {
              color: #48a0e6;
              font-size: 18px;
              font-weight: 400;
            }

            .auc-avg small {
              color: #999;
              font-size: 14px;
            }

            .auc-sales-table {
              width: 840px;
              max-width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
              background: #fff;
            }

            .auc-sales-table td {
              padding: 2px 5px;
              font-size: 14px;
              line-height: 1.05;
              text-align: center;
              vertical-align: middle;
              font-family: Tahoma, Arial, sans-serif;
            }

            .auc-sales-table .auc-head {
              background: #f0f2f5;
              color: #07152f;
              font-weight: 700;
              border-bottom: 1px solid #d8dde6;
              line-height: 1;
            }

            .auc-row-light {
              background: #ffffff;
            }

            .auc-row-dark {
              background: #eeeeee;
            }

            .auc-lot {
              width: 82px;
              text-align: left !important;
            }

            .auc-lot a {
              display: block;
              color: #1267b1;
              text-decoration: underline;
              font-weight: 700;
            }

            .auc-lot span {
              display: block;
              color: #07152f;
              font-size: 13px;
              font-weight: 400;
            }

            .auc-date {
              width: 86px;
              font-size: 13px !important;
            }

            .auc-engine {
              width: 72px;
            }

            .auc-engine b,
            .auc-body b,
            .auc-grade b {
              display: block;
              font-weight: 400;
              color: #111;
            }

            .auc-engine span,
            .auc-body span,
            .auc-grade span {
              display: block;
              margin-top: 1px;
              color: #aaa;
              font-size: 10px;
              line-height: 1;
            }

            .auc-body {
              width: 80px;
            }

            .auc-grade {
              width: 185px;
              color: #891002;
            }

            .auc-grade b {
              color: #891002;
            }

            .auc-mileage {
              width: 70px;
              text-align: right !important;
            }

            .auc-rate-score {
              width: 44px;
              color: #b05963;
              font-family: Arial, sans-serif !important;
              font-size: 13px !important;
              font-weight: 700;
            }

            .auc-price {
              width: 95px;
              text-align: right !important;
              padding-right: 6px !important;
            }

            .auc-price span {
              display: block;
              color: #aaa;
              font-size: 11px;
              white-space: nowrap;
            }

            .auc-price b {
              display: block;
              color: #111;
              font-size: 14px;
              white-space: nowrap;
            }

            .auc-color {
              width: 80px;
              font-size: 13px !important;
            }

            .auc-more-row td {
              text-align: right;
              background: #fff;
              padding-top: 4px;
            }

            .auc-more {
              display: inline-block;
              border: 1px solid #888;
              background: #fff;
              padding: 2px 14px;
              font-size: 18px;
              color: #333;
              text-decoration: none;
            }

            .auc-bottom {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              width: 910px;
              max-width: 100%;
              overflow-x: auto;
            }

            .auc-year-table {
              width: 225px;
              min-width: 225px;
              border-collapse: collapse;
              background: #fff;
            }

            .auc-year-table td,
            .auc-matrix-table td {
              font-family: Tahoma, Arial, sans-serif;
              font-size: 14px;
              line-height: 1;
              text-align: center;
              vertical-align: middle;
              padding: 0;
            }

            .auc-head {
              height: 30px;
              background: #f0f2f5;
              color: #07152f;
              font-weight: 700;
              border: 1px solid #e2e6ee;
              line-height: .9 !important;
            }

            .auc-head a {
              color: inherit;
              text-decoration: none;
              display: block;
              padding-top: 4px;
              height: 100%;
            }

            .auc-head span {
              font-size: 11px;
            }

            .auc-head.active {
              background: #bdd0e2;
            }

            .auc-year {
              width: 48px;
              height: 25px;
              border: 1px solid #e2e6ee;
              padding-top: 3px !important;
            }

            .auc-year a {
              color: #5f74a9;
              font-size: 15px;
              font-weight: 700;
              text-decoration: none;
            }

            .auc-year.active {
              background: #bdd0e2;
            }

            .auc-year.active a {
              color: #333;
            }

            .auc-year-price {
              position: relative;
              height: 25px;
              border: 1px solid #e2e6ee;
              text-align: left !important;
            }

            .auc-year-price a {
              position: relative;
              display: block;
              height: 25px;
              color: #111;
              text-decoration: none;
              overflow: hidden;
            }

            .auc-year-price.active {
              border: 1px solid #6787b2;
            }

            .auc-year-count {
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              background: rgba(255, 217, 157, .8);
            }

            .auc-year-bar {
              position: absolute;
              left: 0;
              top: 5px;
              height: 14px;
              background: linear-gradient(#d8e9f9, #c1ddf3);
              border: 1px solid #bfd5e8;
            }

            .auc-year-value {
              position: absolute;
              left: 108px;
              top: 6px;
              white-space: nowrap;
              font-size: 13px;
              font-weight: 400;
            }

            .auc-matrix-table {
              width: 616px;
              min-width: 616px;
              border-collapse: collapse;
              background: #fff;
            }

            .auc-rate-head {
              width: 58px;
            }

            .auc-rate {
              width: 58px;
              height: 60px;
              border: 1px solid #e2e6ee;
              color: #b05963;
              font-family: Arial, sans-serif !important;
              font-size: 15px !important;
              font-weight: 700;
            }

            .auc-rate a {
              color: inherit;
              text-decoration: none;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 60px;
            }

            .auc-rate.active {
              background: #bdd0e2;
              color: #111;
            }

            .auc-matrix-empty {
              width: 67px;
              height: 60px;
              border: 1px solid #edf0f5;
              background: #fff;
            }

            .auc-matrix-cell {
              position: relative;
              width: 67px;
              height: 60px;
              border: 1px solid #edf0f5;
              background: #fff;
              overflow: hidden;
            }

            .auc-matrix-cell.active {
              border: 1px solid #6787b2;
            }

            .auc-matrix-cell a {
              position: relative;
              display: block;
              width: 67px;
              height: 60px;
              color: #111;
              text-decoration: none;
            }

            .auc-matrix-price {
              position: absolute;
              left: 0;
              right: 0;
              top: 4px;
              z-index: 3;
              text-align: center;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
            }

            .auc-matrix-count-bar {
              position: absolute;
              left: 18px;
              bottom: 4px;
              width: 31px;
              background: #ffd99d;
              z-index: 1;
            }

            .auc-matrix-price-bar {
              position: absolute;
              left: 31px;
              bottom: 4px;
              width: 5px;
              background: #b9d7f0;
              z-index: 2;
            }

            .auc-footer {
              margin-top: 8px;
              font-size: 11px;
              color: #666;
            }
          `,
        }}
      />

      <div className="auc-wrap">
        <div className="auc-top">
          <Link href="/catalog" className="auc-back">
            Назад
          </Link>
          <Link href="/" className="auc-home">
            На главную
          </Link>
        </div>

        <div className="auc-title">
          Средняя цена продажи автомобиля в Японии в зависимости от года, оценки, пробега и кузова
        </div>

        <form method="get" action="/catalog/sales-stats" className="auc-filter">
          <input type="hidden" name="brand" value={brand} />
          <input type="hidden" name="model" value={model} />
          <input type="hidden" name="body" value={body} />
          <input type="hidden" name="yearFrom" value={requestedYearFrom} />
          <input type="hidden" name="yearTo" value={requestedYearTo} />

          <label>
            <span>Год</span>
            <select name="statYear" defaultValue={selectedYear}>
              {yearGroups.map((year) => (
                <option key={year.key} value={year.key}>
                  {year.key}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Оценка</span>
            <select name="statRate" defaultValue={selectedRate}>
              <option value="">Любая</option>
              {rateGroups.map((rate) => (
                <option key={rate.key} value={rate.key}>
                  {rate.key}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Пробег</span>
            <select name="statMileage" defaultValue={selectedMileage}>
              <option value="">Любой</option>
              {MILEAGE_BUCKETS.map((bucket) => (
                <option key={bucket.key} value={bucket.key}>
                  {bucket.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Кузов</span>
            <select name="statBody" defaultValue={selectedBody}>
              <option value="">Любой</option>
              {bodyGroups.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.key} ({entry.count})
                </option>
              ))}
            </select>
          </label>

          <button type="submit">Выбрать</button>

          <div className="auc-avg">
            Средняя цена{" "}
            <b>
              {fmtYen(avgFiltered)}
              {avgFiltered ? " ¥" : ""}
            </b>{" "}
            <small>/ {fmtNum(filteredRows.length)}</small>
          </div>
        </form>

        <table className="auc-sales-table" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td className="auc-head">
                Номер&nbsp;лота
                <br />
                Аукцион
              </td>
              <td className="auc-head">
                Дата
                <br />
                аукциона
              </td>
              <td className="auc-head">
                V,Объем, см3
              </td>
              <td className="auc-head">Кузов</td>
              <td className="auc-head">
                Коробка Модиф
                <br />
                Комплектация
              </td>
              <td className="auc-head">Пробег</td>
              <td className="auc-head">Оценка</td>
              <td className="auc-head">
                Начальная
                <br />
                Продано за
              </td>
              <td className="auc-head">Цвет</td>
            </tr>

            {visibleRows.map((item, index) => (
              <SaleRow key={item.id || `${item.lot}-${index}`} item={item} index={index} />
            ))}

            {filteredRows.length > 10 ? (
              <tr className="auc-more-row">
                <td colSpan={9}>
                  <a
                    className="auc-more"
                    href={buildHref(baseHref, { showAll: showAll ? undefined : "1" })}
                  >
                    {showAll ? "hide..." : "more..."}
                  </a>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="auc-bottom">
          <YearTable items={yearGroups} selectedYear={selectedYear} baseHref={baseHref} />

          <MatrixTable
            items={yearScoped}
            selectedRate={selectedRate}
            selectedMileage={selectedMileage}
            baseHref={baseHref}
          />
        </div>

        <div className="auc-footer">
          {brand} {model} {selectedBody ? `· ${selectedBody}` : ""} · найдено {fmtNum(sales.total)}
        </div>
      </div>
    </main>
  );
}
