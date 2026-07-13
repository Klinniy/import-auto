"use client";

import { useEffect, useMemo, useState } from "react";

type AnyCar = Record<string, any>;

type SaleItem = {
  id?: string;
  lotId?: string;
  carId?: string;
  catalogId?: string;
  sourceId?: string;
  lot?: string;
  link?: string;
  href?: string;
  url?: string;
  detailUrl?: string;
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
  error?: string;
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

function pick(...values: unknown[]) {
  for (const value of values) {
    const cleaned = clean(value);
    if (cleaned && cleaned !== "__any__") return cleaned;
  }

  return "";
}


function lotHref(item: SaleItem) {
  const directUrl = pick(item.href, item.link, item.url, item.detailUrl);

  if (directUrl) {
    if (directUrl.startsWith("/")) return directUrl;
    if (directUrl.startsWith("http")) return directUrl;
  }

  /*
    В /statistics карточки продаж открываются через /catalog/<id>.
    Поэтому используем item.id из /api/statistics/sales.
    Номер lot сам по себе не уникален, он только отображается пользователю.
  */
  const directId = pick(item.id);

  if (directId) {
    return `/catalog/${encodeURIComponent(directId)}?source=stats`;
  }

  /*
    Fallback, если у записи вдруг нет id:
    открываем общий каталог статистики с максимально точными параметрами.
  */
  const params = new URLSearchParams();

  const brand = pick(item.brand);
  const model = pick(item.model);
  const body = pick(item.body);
  const lot = pick(item.lot);
  const year = pick(item.year);

  if (brand) params.set("brand", brand);
  if (model) params.set("model", model);
  if (body) params.set("body", body);
  if (year) {
    params.set("yearFrom", year);
    params.set("yearTo", year);
  }
  if (lot) params.set("lot", lot);

  const query = params.toString();

  return query ? `/statistics?${query}` : "/statistics";
}

function soldOnly(items: SaleItem[]) {
  return items.filter((item) => toNum(item.finishPrice) > 0);
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

function YearTable({
  items,
  selectedYear,
  onYear,
}: {
  items: GroupStat[];
  selectedYear: string;
  onYear: (value: string) => void;
}) {
  const avgMax = Math.max(...items.map((item) => item.avgPrice), 1);
  const countMax = Math.max(...items.map((item) => item.count), 1);

  return (
    <table className="lot-stat-year-table" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td className="lot-stat-head">Год</td>
          <td className="lot-stat-head">Средняя&nbsp;цена&nbsp;¥</td>
        </tr>

        {items.map((item, index) => {
          const active = item.key === selectedYear;
          const avgWidth = Math.max(4, Math.round((item.avgPrice / avgMax) * 100));
          const countWidth = Math.max(4, Math.round((item.count / countMax) * 100));

          return (
            <tr key={item.key} className={index % 2 ? "lot-stat-row-dark" : "lot-stat-row-light"}>
              <td className={active ? "lot-stat-year active" : "lot-stat-year"}>
                <button type="button" onClick={() => onYear(item.key)}>
                  {item.key}
                </button>
              </td>

              <td className={active ? "lot-stat-year-price active" : "lot-stat-year-price"}>
                <button type="button" onClick={() => onYear(item.key)}>
                  <span className="lot-stat-year-count" style={{ width: `${countWidth}%` }} />
                  <span className="lot-stat-year-bar" style={{ width: `${avgWidth}%` }} />
                  <span className="lot-stat-year-value">{fmtYen(item.avgPrice)}</span>
                </button>
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
  active,
  onClick,
}: {
  price: number;
  count: number;
  maxPrice: number;
  maxCount: number;
  active?: boolean;
  onClick: () => void;
}) {
  if (!price || !count) {
    return <td className="lot-stat-matrix-empty" />;
  }

  const priceHeight = Math.max(10, Math.round((price / maxPrice) * 46));
  const countHeight = Math.max(8, Math.round((count / maxCount) * 46));

  return (
    <td className={active ? "lot-stat-matrix-cell active" : "lot-stat-matrix-cell"}>
      <button type="button" onClick={onClick}>
        <span className="lot-stat-matrix-price">{fmtYen(price)}</span>
        <span className="lot-stat-matrix-count-bar" style={{ height: `${countHeight}px` }} />
        <span className="lot-stat-matrix-price-bar" style={{ height: `${priceHeight}px` }} />
      </button>
    </td>
  );
}

function MatrixTable({
  items,
  selectedRate,
  selectedMileage,
  onRate,
  onMileage,
  onCell,
}: {
  items: SaleItem[];
  selectedRate: string;
  selectedMileage: string;
  onRate: (value: string) => void;
  onMileage: (value: string) => void;
  onCell: (rate: string, mileage: string) => void;
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
    <table className="lot-stat-matrix-table" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td className="lot-stat-head lot-stat-rate-head">Оценка</td>

          {MILEAGE_BUCKETS.map((bucket) => (
            <td
              key={bucket.key}
              className={bucket.key === selectedMileage ? "lot-stat-head active" : "lot-stat-head"}
            >
              <button type="button" onClick={() => onMileage(bucket.key)}>
                {bucket.label}
                <br />
                <span>тыс.км</span>
              </button>
            </td>
          ))}

          <td className={!selectedMileage ? "lot-stat-head active" : "lot-stat-head"}>
            <button type="button" onClick={() => onMileage("")}>
              Средняя&nbsp;цена&nbsp;¥
              <br />
              Любой&nbsp;пробег&nbsp;тыс.км
            </button>
          </td>
        </tr>

        {rates.map((rate, index) => (
          <tr key={rate} className={index % 2 ? "lot-stat-row-dark" : "lot-stat-row-light"}>
            <td className={rate === selectedRate ? "lot-stat-rate active" : "lot-stat-rate"}>
              <button type="button" onClick={() => onRate(rate)}>
                {rate}
              </button>
            </td>

            {MILEAGE_BUCKETS.map((bucket) => (
              <MatrixCell
                key={`${rate}-${bucket.key}`}
                price={avgFor(items, rate, bucket.key)}
                count={countFor(items, rate, bucket.key)}
                maxPrice={maxPrice}
                maxCount={maxCount}
                active={rate === selectedRate && bucket.key === selectedMileage}
                onClick={() => onCell(rate, bucket.key)}
              />
            ))}

            <MatrixCell
              price={avgFor(items, rate)}
              count={countFor(items, rate)}
              maxPrice={maxPrice}
              maxCount={maxCount}
              active={rate === selectedRate && !selectedMileage}
              onClick={() => onCell(rate, "")}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SaleRow({ item, index }: { item: SaleItem; index: number }) {
  const href = lotHref(item);

  return (
    <tr className={index % 2 ? "lot-stat-row-dark" : "lot-stat-row-light"}>
      <td className="lot-stat-lot">
        <a href={href} target="_blank" rel="noreferrer" title="Открыть карточку продажи">
          <b>{item.lot || "—"}</b>
        </a>
        <span>{item.auction || "—"}</span>
      </td>

      <td className="lot-stat-date">{formatAuctionDate(item.auctionDate)}</td>

      <td className="lot-stat-engine">
        <b>{item.engineVolume || "—"}</b>
        <span>{clean(item.model)}</span>
      </td>

      <td className="lot-stat-body">
        <b>{item.body || "—"}</b>
        <span>{item.drive || ""}</span>
      </td>

      <td className="lot-stat-grade">
        <b>
          {item.transmission || "—"} {item.drive || ""}
        </b>
        <span>{item.grade || "—"}</span>
      </td>

      <td className="lot-stat-mileage">{fmtNum(item.mileage)}</td>

      <td className="lot-stat-rate-score">{item.rate || "—"}</td>

      <td className="lot-stat-price">
        <span>{fmtYen(item.startPrice)} ¥</span>
        <b>{fmtYen(item.finishPrice)} ¥</b>
      </td>

      <td className="lot-stat-color">{item.color || ""}</td>
    </tr>
  );
}

export default function LotSalesStatsPanel({ car }: { car: AnyCar | null }) {
  const brand = pick(car?.brand, car?.marka, car?.markaName, car?.make, car?.MARKA_NAME);
  const model = pick(car?.model, car?.modelName, car?.MODEL_NAME);
  const body = pick(car?.body, car?.kuzov, car?.chassis, car?.frame, car?.KUZOV);
  const year = pick(car?.year, car?.YEAR, car?.releaseYear);

  const [items, setItems] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedRate, setSelectedRate] = useState("");
  const [selectedMileage, setSelectedMileage] = useState("");
  const [selectedBody, setSelectedBody] = useState(body);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setSelectedYear(year);
    setSelectedBody(body);
    setSelectedRate("");
    setSelectedMileage("");
    setShowAll(false);
  }, [brand, model, body, year]);

  useEffect(() => {
    if (!brand || !model) {
      setItems([]);
      setTotal(0);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();

    params.set("brand", brand);
    params.set("model", model);
    params.set("page", "1");
    params.set("limit", "1200");
    params.set("sort", "auction_desc");

    setLoading(true);
    setError("");

    fetch(`/api/statistics/sales?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: SalesPayload) => {
        const rows = Array.isArray(payload.items) ? payload.items : [];
        setItems(rows);
        setTotal(Number(payload.total || rows.length || 0));
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError("Не удалось загрузить статистику продаж.");
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [brand, model]);

  const allSold = useMemo(
    () => soldOnly(items).sort((a, b) => parseDate(b.auctionDate) - parseDate(a.auctionDate)),
    [items]
  );

  const bodyGroups = useMemo(() => groupBy(allSold, (item) => clean(item.body)), [allSold]);

  const effectiveBody = selectedBody || body || bodyGroups[0]?.key || "";

  const bodyScoped = useMemo(() => {
    if (!effectiveBody) return allSold;
    return allSold.filter((item) => clean(item.body) === effectiveBody);
  }, [allSold, effectiveBody]);

  const yearGroups = useMemo(
    () =>
      groupBy(bodyScoped, (item) => String(item.year || ""))
        .filter((item) => item.key)
        .sort((a, b) => Number(b.key) - Number(a.key)),
    [bodyScoped]
  );

  const effectiveYear = selectedYear || year || yearGroups[0]?.key || "";

  const yearScoped = useMemo(() => {
    if (!effectiveYear) return bodyScoped;
    return bodyScoped.filter((item) => String(item.year || "") === effectiveYear);
  }, [bodyScoped, effectiveYear]);

  const rateGroups = useMemo(
    () =>
      groupBy(yearScoped, (item) => clean(item.rate))
        .filter((item) => item.key)
        .sort((a, b) => {
          const ai = RATE_ORDER.indexOf(a.key);
          const bi = RATE_ORDER.indexOf(b.key);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        }),
    [yearScoped]
  );

  const filteredRows = useMemo(
    () =>
      yearScoped.filter((item) => {
        if (selectedRate && clean(item.rate) !== selectedRate) return false;
        if (selectedMileage && !inMileage(item, selectedMileage)) return false;
        return true;
      }),
    [yearScoped, selectedRate, selectedMileage]
  );

  const avgFiltered = avg(filteredRows.map((item) => toNum(item.finishPrice)));
  const visibleRows = showAll ? filteredRows.slice(0, 49) : filteredRows.slice(0, 10);

  function applyFilters() {
    setShowAll(false);
  }

  function setYear(value: string) {
    setSelectedYear(value);
    setShowAll(false);
  }

  function setRate(value: string) {
    setSelectedRate(value);
    setShowAll(false);
  }

  function setMileage(value: string) {
    setSelectedMileage(value);
    setShowAll(false);
  }

  function setBody(value: string) {
    setSelectedBody(value);
    setSelectedYear("");
    setSelectedRate("");
    setSelectedMileage("");
    setShowAll(false);
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .lot-stat-wrap {
              padding: 14px;
              font-family: Tahoma, Arial, sans-serif;
              color: #07152f;
              overflow-x: auto;
            }

            .lot-stat-inner {
              width: 910px;
              max-width: 100%;
            }

            .lot-stat-title {
              margin: 0 0 8px 0;
              font-size: 15px;
              line-height: 1.2;
              font-weight: 400;
              color: #222;
            }

            .lot-stat-filter {
              width: 840px;
              max-width: 100%;
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;
              font-size: 13px;
              white-space: nowrap;
            }

            .lot-stat-filter label {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-weight: 700;
            }

            .lot-stat-filter span {
              font-weight: 400;
            }

            .lot-stat-filter select {
              height: 21px;
              border: 1px solid #93a3bc;
              background: #fff;
              font-size: 12px;
              font-family: Arial, sans-serif;
              padding: 0 2px;
            }

            .lot-stat-filter button {
              height: 21px;
              padding: 0 18px;
              border: 0;
              background: linear-gradient(#7dc4ff, #3188df);
              color: #fff;
              font-size: 12px;
              font-family: Tahoma, Arial, sans-serif;
              cursor: pointer;
            }

            .lot-stat-avg {
              margin-left: auto;
              color: #444;
              font-size: 13px;
              font-weight: 400;
            }

            .lot-stat-avg b {
              color: #48a0e6;
              font-size: 18px;
              font-weight: 400;
            }

            .lot-stat-avg small {
              color: #999;
              font-size: 14px;
            }

            .lot-stat-sales-table {
              width: 840px;
              max-width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
              background: #fff;
            }

            .lot-stat-sales-table td {
              padding: 2px 5px;
              font-size: 14px;
              line-height: 1.05;
              text-align: center;
              vertical-align: middle;
              font-family: Tahoma, Arial, sans-serif;
            }

            .lot-stat-sales-table .lot-stat-head {
              background: #f0f2f5;
              color: #07152f;
              font-weight: 700;
              border-bottom: 1px solid #d8dde6;
              line-height: 1;
            }

            .lot-stat-row-light {
              background: #ffffff;
            }

            .lot-stat-row-dark {
              background: #eeeeee;
            }

            .lot-stat-lot {
              width: 82px;
              text-align: left !important;
            }

            .lot-stat-lot a {
              display: block;
              color: #1267b1;
              text-decoration: underline;
              font-weight: 700;
            }

            .lot-stat-lot a:hover {
              color: #d8001f;
            }

            .lot-stat-lot b {
              display: block;
              color: inherit;
              text-decoration: inherit;
              font-weight: 700;
            }

            .lot-stat-lot span {
              display: block;
              color: #07152f;
              font-size: 13px;
              font-weight: 400;
            }

            .lot-stat-date {
              width: 86px;
              font-size: 13px !important;
            }

            .lot-stat-engine {
              width: 72px;
            }

            .lot-stat-engine b,
            .lot-stat-body b,
            .lot-stat-grade b {
              display: block;
              font-weight: 400;
              color: #111;
            }

            .lot-stat-engine span,
            .lot-stat-body span,
            .lot-stat-grade span {
              display: block;
              margin-top: 1px;
              color: #aaa;
              font-size: 10px;
              line-height: 1;
            }

            .lot-stat-body {
              width: 80px;
            }

            .lot-stat-grade {
              width: 185px;
              color: #891002;
            }

            .lot-stat-grade b {
              color: #891002;
            }

            .lot-stat-mileage {
              width: 70px;
              text-align: right !important;
            }

            .lot-stat-rate-score {
              width: 44px;
              color: #b05963;
              font-family: Arial, sans-serif !important;
              font-size: 13px !important;
              font-weight: 700;
            }

            .lot-stat-price {
              width: 95px;
              text-align: right !important;
              padding-right: 6px !important;
            }

            .lot-stat-price span {
              display: block;
              color: #aaa;
              font-size: 11px;
              white-space: nowrap;
            }

            .lot-stat-price b {
              display: block;
              color: #111;
              font-size: 14px;
              white-space: nowrap;
            }

            .lot-stat-color {
              width: 80px;
              font-size: 13px !important;
            }

            .lot-stat-more-row td {
              text-align: right;
              background: #fff;
              padding-top: 4px;
            }

            .lot-stat-more {
              display: inline-block;
              border: 1px solid #888;
              background: #fff;
              padding: 2px 14px;
              font-size: 18px;
              color: #333;
              text-decoration: none;
              cursor: pointer;
            }

            .lot-stat-bottom {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              width: 910px;
              max-width: 100%;
              overflow-x: auto;
            }

            .lot-stat-year-table {
              width: 225px;
              min-width: 225px;
              border-collapse: collapse;
              background: #fff;
            }

            .lot-stat-year-table td,
            .lot-stat-matrix-table td {
              font-family: Tahoma, Arial, sans-serif;
              font-size: 14px;
              line-height: 1;
              text-align: center;
              vertical-align: middle;
              padding: 0;
            }

            .lot-stat-head {
              height: 30px;
              background: #f0f2f5;
              color: #07152f;
              font-weight: 700;
              border: 1px solid #e2e6ee;
              line-height: .9 !important;
            }

            .lot-stat-head button {
              color: inherit;
              text-decoration: none;
              display: block;
              width: 100%;
              height: 100%;
              padding-top: 4px;
              background: transparent;
              border: 0;
              cursor: pointer;
              font: inherit;
            }

            .lot-stat-head span {
              font-size: 11px;
            }

            .lot-stat-head.active {
              background: #bdd0e2;
            }

            .lot-stat-year {
              width: 48px;
              height: 25px;
              border: 1px solid #e2e6ee;
              padding-top: 3px !important;
            }

            .lot-stat-year button {
              color: #5f74a9;
              font-size: 15px;
              font-weight: 700;
              text-decoration: none;
              background: transparent;
              border: 0;
              cursor: pointer;
            }

            .lot-stat-year.active {
              background: #bdd0e2;
            }

            .lot-stat-year.active button {
              color: #333;
            }

            .lot-stat-year-price {
              position: relative;
              height: 25px;
              border: 1px solid #e2e6ee;
              text-align: left !important;
            }

            .lot-stat-year-price button {
              position: relative;
              display: block;
              width: 100%;
              height: 25px;
              color: #111;
              text-decoration: none;
              overflow: hidden;
              background: transparent;
              border: 0;
              cursor: pointer;
              padding: 0;
            }

            .lot-stat-year-price.active {
              border: 1px solid #6787b2;
            }

            .lot-stat-year-count {
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              background: rgba(255, 217, 157, .8);
            }

            .lot-stat-year-bar {
              position: absolute;
              left: 0;
              top: 5px;
              height: 14px;
              background: linear-gradient(#d8e9f9, #c1ddf3);
              border: 1px solid #bfd5e8;
            }

            .lot-stat-year-value {
              position: absolute;
              left: 108px;
              top: 6px;
              white-space: nowrap;
              font-size: 13px;
              font-weight: 400;
            }

            .lot-stat-matrix-table {
              width: 616px;
              min-width: 616px;
              border-collapse: collapse;
              background: #fff;
            }

            .lot-stat-rate-head {
              width: 58px;
            }

            .lot-stat-rate {
              width: 58px;
              height: 60px;
              border: 1px solid #e2e6ee;
              color: #b05963;
              font-family: Arial, sans-serif !important;
              font-size: 15px !important;
              font-weight: 700;
            }

            .lot-stat-rate button {
              color: inherit;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 60px;
              background: transparent;
              border: 0;
              cursor: pointer;
              font: inherit;
            }

            .lot-stat-rate.active {
              background: #bdd0e2;
              color: #111;
            }

            .lot-stat-matrix-empty {
              width: 67px;
              height: 60px;
              border: 1px solid #edf0f5;
              background: #fff;
            }

            .lot-stat-matrix-cell {
              position: relative;
              width: 67px;
              height: 60px;
              border: 1px solid #edf0f5;
              background: #fff;
              overflow: hidden;
            }

            .lot-stat-matrix-cell.active {
              border: 1px solid #6787b2;
            }

            .lot-stat-matrix-cell button {
              position: relative;
              display: block;
              width: 67px;
              height: 60px;
              color: #111;
              background: transparent;
              border: 0;
              cursor: pointer;
              padding: 0;
            }

            .lot-stat-matrix-price {
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

            .lot-stat-matrix-count-bar {
              position: absolute;
              left: 18px;
              bottom: 4px;
              width: 31px;
              background: #ffd99d;
              z-index: 1;
            }

            .lot-stat-matrix-price-bar {
              position: absolute;
              left: 31px;
              bottom: 4px;
              width: 5px;
              background: #b9d7f0;
              z-index: 2;
            }

            .lot-stat-state {
              padding: 28px;
              font-size: 14px;
              font-weight: 700;
              color: #64748b;
            }
          `,
        }}
      />

      <div className="border-b border-slate-100 bg-[#07152f] px-4 py-4 text-white">
        <div className="text-lg font-black">Статистика продаж</div>
        <div className="mt-1 text-sm font-bold text-white/70">
          Средняя цена продажи автомобиля в Японии в зависимости от года, оценки, пробега и кузова
        </div>
      </div>

      {loading ? (
        <div className="lot-stat-state">Загружаю статистику продаж...</div>
      ) : error ? (
        <div className="lot-stat-state text-red-600">{error}</div>
      ) : !brand || !model ? (
        <div className="lot-stat-state">Недостаточно данных по лоту для статистики.</div>
      ) : !allSold.length ? (
        <div className="lot-stat-state">По этому автомобилю статистика продаж не найдена.</div>
      ) : (
        <div className="lot-stat-wrap">
          <div className="lot-stat-inner">
            <div className="lot-stat-title">
              Средняя цена продажи автомобиля в Японии в зависимости от года, оценки, пробега и кузова
            </div>

            <div className="lot-stat-filter">
              <label>
                <span>Год</span>
                <select
                  value={effectiveYear}
                  onChange={(event) => setYear(event.target.value)}
                >
                  {yearGroups.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.key}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Оценка</span>
                <select
                  value={selectedRate}
                  onChange={(event) => setRate(event.target.value)}
                >
                  <option value="">Любая</option>
                  {rateGroups.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.key}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Пробег</span>
                <select
                  value={selectedMileage}
                  onChange={(event) => setMileage(event.target.value)}
                >
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
                <select
                  value={effectiveBody}
                  onChange={(event) => setBody(event.target.value)}
                >
                  <option value="">Любой</option>
                  {bodyGroups.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.key} ({entry.count})
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" onClick={applyFilters}>
                Выбрать
              </button>

              <div className="lot-stat-avg">
                Средняя цена{" "}
                <b>
                  {fmtYen(avgFiltered)}
                  {avgFiltered ? " ¥" : ""}
                </b>{" "}
                <small>/ {fmtNum(filteredRows.length)}</small>
              </div>
            </div>

            <table className="lot-stat-sales-table" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td className="lot-stat-head">
                    Номер&nbsp;лота
                    <br />
                    Аукцион
                  </td>
                  <td className="lot-stat-head">
                    Дата
                    <br />
                    аукциона
                  </td>
                  <td className="lot-stat-head">V,Объем, см3</td>
                  <td className="lot-stat-head">Кузов</td>
                  <td className="lot-stat-head">
                    Коробка Модиф
                    <br />
                    Комплектация
                  </td>
                  <td className="lot-stat-head">Пробег</td>
                  <td className="lot-stat-head">Оценка</td>
                  <td className="lot-stat-head">
                    Начальная
                    <br />
                    Продано за
                  </td>
                  <td className="lot-stat-head">Цвет</td>
                </tr>

                {visibleRows.map((item, index) => (
                  <SaleRow key={item.id || `${item.lot}-${index}`} item={item} index={index} />
                ))}

                {filteredRows.length > 10 ? (
                  <tr className="lot-stat-more-row">
                    <td colSpan={9}>
                      <button
                        type="button"
                        className="lot-stat-more"
                        onClick={() => setShowAll((value) => !value)}
                      >
                        {showAll ? "Скрыть" : "Показать ещё"}
                      </button>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            <div className="lot-stat-bottom">
              <YearTable
                items={yearGroups}
                selectedYear={effectiveYear}
                onYear={setYear}
              />

              <MatrixTable
                items={yearScoped}
                selectedRate={selectedRate}
                selectedMileage={selectedMileage}
                onRate={setRate}
                onMileage={setMileage}
                onCell={(rate, mileage) => {
                  setSelectedRate(rate);
                  setSelectedMileage(mileage);
                  setShowAll(false);
                }}
              />
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              {brand} {model} {effectiveBody ? `· ${effectiveBody}` : ""} · найдено {fmtNum(total)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
