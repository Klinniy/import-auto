#!/usr/bin/env node

function safeError(value) {
  return String(value || "")
    .replace(/([?&](?:code|key|token|pass|password|auth)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/https?:\/\/[^\s]+/gi, "[redacted-url]")
    .slice(0, 500);
}

async function main() {
  const lotId = process.argv[2] || process.env.FACTORY_CATALOG_AUDIT_LOT_ID;
  const baseUrl = process.env.FACTORY_CATALOG_AUDIT_BASE_URL || "http://localhost:3000";

  if (!lotId) {
    console.error("Set FACTORY_CATALOG_AUDIT_LOT_ID or pass a lot id as the first argument.");
    process.exit(2);
  }

  const url = new URL(`/api/catalog/factory/${encodeURIComponent(lotId)}`, baseUrl);
  const response = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
  const text = await response.text();

  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {}

  const format = payload && typeof payload === "object" ? "json" : "text";
  const count = Array.isArray(payload?.items) ? payload.items.length : 0;
  const source = payload?.source || payload?.catalogSource || "unknown";
  const error = payload?.safeError || payload?.error || (response.ok ? "" : text.slice(0, 300));

  console.log("Factory catalogue diagnostic");
  console.log(`Lot: ${lotId}`);
  console.log(`Source: ${source}`);
  console.log(`HTTP status: ${response.status}`);
  console.log(`Response format: ${format}`);
  console.log(`Modifications found: ${count}`);
  console.log(`Safe error: ${safeError(error) || "none"}`);

  if (response.status >= 500) process.exit(1);
}

await main();
