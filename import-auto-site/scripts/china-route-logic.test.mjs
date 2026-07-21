import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routeSource = await readFile(
  new URL("../app/api/calculator/china/route.ts", import.meta.url),
  "utf8",
);

test("China calculator uses authoritative fiz/jur total for customs and utilization", () => {
  assert.match(
    routeSource,
    /const dutyUsdTotal = params\.taxMode === 1 \? params\.calcos\.jur : params\.calcos\.fiz/,
  );
  assert.match(
    routeSource,
    /const customsAndUtilRub = Math\.round\(dutyUsdTotal \* usdRub\)/,
  );
  assert.match(
    routeSource,
    /const russiaTotalRub = customsAndUtilRub \+ storageRub \+ brokerRub \+ glonassRub/,
  );
  assert.doesNotMatch(routeSource, /customsDutyRub = Math\.round\(infoSplit\.dutyPart/);
  assert.doesNotMatch(routeSource, /utilFeeRub = Math\.round\(infoSplit\.utilPart/);
});

test("China calculator displays one combined authoritative duty row", () => {
  assert.match(routeSource, /Таможенная пошлина и утилизационный сбор/);
  assert.doesNotMatch(routeSource, /makeRow\("Таможенная пошлина", infoSplit/);
  assert.doesNotMatch(routeSource, /makeRow\("Утилизационный сбор", infoSplit/);
});

test("reference case does not lose the amount omitted by fiz_info", () => {
  const fizUsd = 25467;
  const fizInfoPartsUsd = 7957 + 12888;
  const usdRub = 78.3987;
  const authoritative = Math.round(fizUsd * usdRub);
  const incomplete = Math.round(fizInfoPartsUsd * usdRub);

  assert.equal(authoritative, 1996580);
  assert.equal(authoritative > incomplete, true);
  assert.equal(
    Math.round((fizUsd - fizInfoPartsUsd) * usdRub),
    authoritative - incomplete,
  );
});

test("China-side expenses are included directly in the Calcos customs price", () => {
  assert.match(routeSource, /const customsPriceCny = priceCny \+ chinaExpensesCny/);
  assert.match(routeSource, /const customsPriceRub = Math\.round\(customsPriceCny \* cnyRub\)/);
  assert.match(routeSource, /\? customsPriceCny : customsPriceRub/);
  assert.match(routeSource, /clamp\(toNumber\(body\.sheet1, 0\), 0, 10_000_000\)/);
  assert.doesNotMatch(routeSource, /body\.sheet1 \?\? body\.chinaExpensesRub/);
});

test("reference lot customs base contains 171800 plus 65000 CNY", () => {
  const priceCny = 171800;
  const chinaExpensesCny = 65000;
  const cnyPerUsd = 6.77;
  const missingDutyUsd = (chinaExpensesCny / cnyPerUsd) * 0.48;

  assert.equal(priceCny + chinaExpensesCny, 236800);
  assert.equal(Math.round(missingDutyUsd), 4609);
});

test("China request sends the supplier's DVS-30 flag", () => {
  assert.match(routeSource, /url\.searchParams\.set\("dvs30", String\(params\.dvs30\)\)/);
  assert.match(routeSource, /const dvs30 = calcDvs30\(body\)/);
});
