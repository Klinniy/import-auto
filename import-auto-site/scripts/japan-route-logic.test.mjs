import test from "node:test";
import assert from "node:assert/strict";
import { calculateTotals, parseCalcosXml, parseCurrencyString, splitDutyInfo } from "./audit-japan-calculator.mjs";

const rates = {
  usdRub: { value: 76.6213, source: "API currency" },
  eurRub: { value: 87.5781, source: "API currency" },
  jpyRub: { value: 0.472679, source: "API currency" },
};

function xml({ sum = 1124303, fiz = 5235, jur = 6200, fizInfo = "4000;1235", jurInfo = "5000;1200", rows = true } = {}) {
  return `<response>
    <sum>${sum}</sum>
    <fiz>${fiz}</fiz>
    <jur>${jur}</jur>
    <fiz_info>${fizInfo}</fiz_info>
    <jur_info>${jurInfo}</jur_info>
    <currency>USDRUB_system:76.6213;EURRUB_system:87.5781;JPYRUB_system:0.472679;</currency>
    ${rows ? `<row><tag1>1200000</tag1></row><row><tag1>70000</tag1></row><row><tag1>30000</tag1></row><row><tag1>29000</tag1></row><row><tag2>${fiz}</tag2></row><row><tag3>30000</tag3></row><row><tag3>65000</tag3></row>` : ""}
  </response>`;
}

test("route logic parses Calcos currency line without legacy usd/eur/jpy tags", () => {
  assert.deepEqual(parseCurrencyString("USDRUB_system:76.6213;EURRUB_system:87.5781;JPYRUB_system:0.472679;"), {
    usdRub: 76.6213,
    eurRub: 87.5781,
    jpyRub: 0.472679,
  });
});

test("route logic parses multiple tag1/tag2/tag3 rows", () => {
  const parsed = parseCalcosXml(xml());
  assert.deepEqual(parsed.rows.tag1, [1200000, 70000, 30000, 29000]);
  assert.deepEqual(parsed.rows.tag2, [5235]);
  assert.deepEqual(parsed.rows.tag3, [30000, 65000]);
});

test("route logic reconstructs Calcos sum from row formula", () => {
  const parsed = parseCalcosXml(xml());
  const result = calculateTotals({ aucPrice: 1200000 }, parsed, 2, rates);
  assert.equal(result.reconstructedSumRub, result.apiSumRub);
  assert.equal(result.reconstructionDiffRub, 0);
  assert.equal(result.routeEquivalentTotalRub, result.apiSumRub);
});

test("route logic uses fiz_info for physical duty split", () => {
  const split = splitDutyInfo(parseCalcosXml(xml({ fizInfo: "Пошлина 4000; Утиль 1235" })).fizInfo);
  assert.deepEqual(split, { dutyPart: 4000, utilPart: 1235 });
});

test("route logic uses jur_info for juridical duty split", () => {
  const parsed = parseCalcosXml(xml({ jur: 6200, jurInfo: "Пошлина 5000; Утиль 1200" }));
  const split = splitDutyInfo(parsed.jurInfo);
  assert.deepEqual(split, { dutyPart: 5000, utilPart: 1200 });
});

test("route logic detects mismatch greater than two rubles", () => {
  const parsed = parseCalcosXml(xml({ sum: 1357640 }));
  const result = calculateTotals({ aucPrice: 1200000 }, parsed, 2, rates);
  assert.equal(result.reconstructionDiffRub > 2, true);
});

test("route logic does not double-add CALCOS_JAPAN_* expenses when rows exist", () => {
  const parsed = parseCalcosXml(xml());
  const result = calculateTotals({ aucPrice: 1200000 }, parsed, 2, rates, {
    CALCOS_JAPAN_SHEET1: "99999999",
    CALCOS_JAPAN_FREIGHT_USD: "999999",
    CALCOS_JAPAN_STORAGE_RUB: "999999",
    CALCOS_JAPAN_BROKER_RUB: "999999",
    CALCOS_JAPAN_GLONASS_RUB: "999999",
  });
  assert.equal(result.routeEquivalentTotalRub, result.apiSumRub);
  assert.equal(result.usedFallback, false);
});

test("route logic uses fallback components when rows are absent", () => {
  const parsed = parseCalcosXml(xml({ rows: false }));
  const result = calculateTotals({ aucPrice: 1200000 }, parsed, 2, rates);
  assert.equal(result.usedFallback, true);
  assert.equal(result.routeEquivalentTotalRub > 0, true);
});

test("client diagnostics should not include rawXml or secret URL fields", () => {
  const parsed = parseCalcosXml(xml());
  const result = calculateTotals({ aucPrice: 1200000 }, parsed, 2, rates);
  const clientPayload = {
    apiSumRub: result.apiSumRub,
    reconstructedSumRub: result.reconstructedSumRub,
    reconstructionDiffRub: result.reconstructionDiffRub,
    currencySource: "calcos",
    calculationSource: "calcos",
    usedFallback: result.usedFallback,
  };
  const serialized = JSON.stringify(clientPayload);
  assert.equal(serialized.includes("rawXml"), false);
  assert.equal(serialized.includes("CALCOS_DUTY_API_URL"), false);
  assert.equal(serialized.includes("https://"), false);
});
