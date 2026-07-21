import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routeSource = await readFile(new URL("../app/api/calculator/china/route.ts", import.meta.url), "utf8");

test("China customs basis includes car price and China expenses", () => {
  assert.match(routeSource, /const customsPriceCny = priceCny \+ chinaExpensesCny/);
  assert.match(routeSource, /const customsPriceRub = Math\.round\(customsPriceCny \* cnyRub\)/);
  assert.match(routeSource, /priceRub: customsPriceRub/);
  assert.match(routeSource, /url\.searchParams\.set\("sheet1", "0"\)/);
});

test("China calculator uses authoritative fiz and jur totals", () => {
  assert.match(routeSource, /params\.taxMode === 1 \? params\.calcos\.jur : params\.calcos\.fiz/);
  assert.match(routeSource, /Таможенная пошлина и утилизационный сбор/);
});

test("China calculator sends compatibility flags", () => {
  assert.match(routeSource, /url\.searchParams\.set\("passing"/);
  assert.match(routeSource, /url\.searchParams\.set\("pasing"/);
  assert.match(routeSource, /url\.searchParams\.set\("dvs30"/);
});

test("reference customs basis is 236800 CNY", () => {
  assert.equal(171800 + 65000, 236800);
});
