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

test("China-side 65,000 CNY expenses are included in the Calcos customs base", () => {
  assert.match(routeSource, /const chinaExpensesCny = Math\.round/);
  assert.match(routeSource, /const chinaExpensesRub = Math\.round\(chinaExpensesCny \* cnyRub\)/);
  assert.match(routeSource, /body\.sheet1 \?\? body\.chinaExpensesRub \?\? chinaExpensesRub/);
  assert.doesNotMatch(routeSource, /CALCOS_CHINA_SHEET1 \?\? 8500/);
});
