function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeLotPrice(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;

  const normalized = clean(value)
    .replace(/\s+/g, "")
    .replace(/[,，]/g, ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function firstPrice(car, keys) {
  for (const key of keys) {
    const value = normalizeLotPrice(car?.[key]);
    if (value > 0) return value;
  }

  return 0;
}

export const LOT_PRICE_PRIORITY = [
  "sold/finish price",
  "current/bid/normalized price",
  "start/starting price fallback",
];

export function selectLotPriceJpy(car) {
  // Price priority for the Japan lot calculator:
  // 1. final sale price for sold lots;
  // 2. current price/current bid for active lots, including normalized `price`/`averagePrice` fields used by the lot card header;
  // 3. start price only when no reliable actual/current price exists;
  // 4. 0 when no reliable price is present.
  return (
    firstPrice(car, ["finishPrice", "soldPrice", "FINISH", "finish", "sold_price"]) ||
    firstPrice(car, [
      "currentPrice",
      "bidPrice",
      "CURRENT",
      "current",
      "BID",
      "bid",
      "price",
      "PRICE",
      "averagePrice",
      "avgPrice",
      "AVG_PRICE",
      "average_price",
    ]) ||
    firstPrice(car, ["startPrice", "startingPrice", "START", "start", "starting_price"]) ||
    0
  );
}
