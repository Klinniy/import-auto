import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLotPrice, selectLotPriceJpy } from "../components/lotPriceSelection.mjs";

test("finishPrice has priority over currentPrice and startPrice", () => {
  assert.equal(selectLotPriceJpy({ finishPrice: 220000, currentPrice: 157000, startPrice: 70000 }), 220000);
});

test("currentPrice has priority over startPrice", () => {
  assert.equal(selectLotPriceJpy({ currentPrice: 157000, startPrice: 70000 }), 157000);
});

test("startPrice is used only when actual/current prices are absent", () => {
  assert.equal(selectLotPriceJpy({ startPrice: 70000 }), 70000);
});

test("string prices with spaces and currency signs are normalized", () => {
  assert.equal(normalizeLotPrice("157 000 ¥"), 157000);
  assert.equal(selectLotPriceJpy({ currentPrice: "157 000 JPY", startPrice: "70 000 ¥" }), 157000);
});

test("missing or invalid price returns zero without NaN", () => {
  const value = selectLotPriceJpy({ currentPrice: "", startPrice: "—" });
  assert.equal(value, 0);
  assert.equal(Number.isNaN(value), false);
});
