import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotals,
  parseCalcosXml,
  parseCurrencyString,
  safeUrl,
  splitDutyInfo,
} from "./audit-japan-calculator.mjs";

const fixtureXml = `
<response>
  <sum>1234567</sum>
  <fiz>4100</fiz>
  <jur>5200</jur>
  <fiz_info>Пошлина 3000 USD; Утилизационный сбор 1100 USD</fiz_info>
  <jur_info>Пошлина 4000 USD; Утилизационный сбор 1200 USD</jur_info>
  <tax_mode>2</tax_mode>
  <currency>USDRUB_system:76.6213;EURRUB_system:87.5781;JPYRUB_system:0.472679;</currency>
</response>`;

const env = {
  CALCOS_JAPAN_SHEET1: "65000",
  CALCOS_JAPAN_FREIGHT_USD: "350",
  CALCOS_JAPAN_STORAGE_RUB: "6000",
  CALCOS_JAPAN_BROKER_RUB: "6000",
  CALCOS_JAPAN_GLONASS_RUB: "50000",
};

const rates = {
  usdRub: { value: 88, source: "fallback" },
  eurRub: { value: 95, source: "fallback" },
  jpyRub: { value: 0.48, source: "CBR" },
};

test("parseCurrencyString extracts per-one currency rates from Calcos currency line", () => {
  assert.deepEqual(parseCurrencyString("USDRUB_system:76.6213;EURRUB_system:87.5781;JPYRUB_system:0.472679;"), {
    usdRub: 76.6213,
    eurRub: 87.5781,
    jpyRub: 0.472679,
  });
});

test("parseCalcosXml and splitDutyInfo parse fiz_info and jur_info", () => {
  const parsed = parseCalcosXml(fixtureXml);
  assert.equal(parsed.sum, 1234567);
  assert.equal(parsed.fiz, 4100);
  assert.equal(parsed.jur, 5200);
  assert.deepEqual(splitDutyInfo(parsed.fizInfo), { dutyPart: 3000, utilPart: 1100 });
  assert.deepEqual(splitDutyInfo(parsed.jurInfo), { dutyPart: 4000, utilPart: 1200 });
});

test("calculateTotals independently sums all displayed components", () => {
  const parsed = parseCalcosXml(fixtureXml);
  const result = calculateTotals(
    { aucPrice: 1200000, year: 2024, volume: 1800, power: 120, fuel: 2, passing: 1 },
    parsed,
    2,
    rates,
    env,
  );
  const manual =
    result.components.aucRub +
    result.components.japanExpensesRub +
    result.components.freightRub +
    result.components.customsDutyRub +
    result.components.utilFeeRub +
    result.components.storageRub +
    result.components.brokerRub +
    result.components.glonassRub;
  assert.equal(result.componentsIndependentTotalRub, manual);
  assert.equal(result.diffRouteVsComponentsRub, 0);
});

test("calculateTotals detects an artificial mismatch against API sum", () => {
  const parsed = parseCalcosXml(fixtureXml.replace("<sum>1234567</sum>", "<sum>1</sum>"));
  const result = calculateTotals(
    { aucPrice: 1200000, year: 2024, volume: 1800, power: 120, fuel: 2, passing: 1 },
    parsed,
    2,
    rates,
    env,
  );
  assert.notEqual(result.diffRouteVsApiRub, 0);
  assert.notEqual(result.diffComponentsVsApiRub, 0);
});

test("safeUrl hides path secrets and query parameters", () => {
  assert.equal(
    safeUrl("https://calcos.example.test/api/private-token/secret-endpoint?key=hidden&verbose=1"),
    "https://calcos.example.test/api/[redacted]",
  );
});
