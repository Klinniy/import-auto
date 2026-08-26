import { mkdirSync } from "node:fs";
import path from "node:path";
// Node 22 runtime on MosaicAuto includes the built-in SQLite module.
// @ts-ignore -- project currently uses @types/node 20, which does not declare node:sqlite.
import { DatabaseSync } from "node:sqlite";

export type PurchaseLeadInput = {
  source: string;
  name: string;
  phone: string;
  city?: string;
  comment?: string;
  country?: string;
  market?: string;
  lot?: string;
  carId?: string;
  brand?: string;
  model?: string;
  year?: number | null;
  priceForeign?: string;
  currency?: string;
  calculatedTotalRub?: number | null;
  pageUrl?: string;
  visitorId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  userAgent?: string;
};

export type SavedPurchaseLead = {
  id: string;
  createdAt: string;
};

let db: DatabaseSync | null = null;

function defaultDbPath() {
  const cwd = process.cwd().replace(/\\/g, "/");

  if (cwd.startsWith("/opt/mosaicauto/staging/")) {
    return "/opt/mosaicauto/runtime/purchase-leads-staging.sqlite";
  }

  if (cwd.startsWith("/opt/mosaicauto/site/")) {
    return "/opt/mosaicauto/runtime/purchase-leads-production.sqlite";
  }

  return path.join(process.cwd(), ".data", "purchase-leads.sqlite");
}

export function getPurchaseLeadDbPath() {
  return process.env.LEADS_DB_PATH || defaultDbPath();
}

function openDb() {
  if (db) return db;

  const file = getPurchaseLeadDbPath();
  mkdirSync(path.dirname(file), { recursive: true });

  const next = new DatabaseSync(file);
  next.exec("PRAGMA journal_mode = WAL;");
  next.exec("PRAGMA busy_timeout = 5000;");
  next.exec(`
    CREATE TABLE IF NOT EXISTS purchase_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      source TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT,
      comment TEXT,
      country TEXT,
      market TEXT,
      lot TEXT,
      car_id TEXT,
      brand TEXT,
      model TEXT,
      year INTEGER,
      price_foreign TEXT,
      currency TEXT,
      calculated_total_rub INTEGER,
      page_url TEXT,
      visitor_id TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      referrer TEXT,
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_purchase_leads_created_at
      ON purchase_leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_purchase_leads_phone
      ON purchase_leads(phone);
    CREATE INDEX IF NOT EXISTS idx_purchase_leads_lot
      ON purchase_leads(lot);
    CREATE INDEX IF NOT EXISTS idx_purchase_leads_visitor
      ON purchase_leads(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_leads_status
      ON purchase_leads(status);
  `);

  db = next;
  return next;
}

function leadId() {
  return `lead_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function savePurchaseLead(input: PurchaseLeadInput): SavedPurchaseLead {
  const database = openDb();
  const id = leadId();
  const now = new Date().toISOString();

  const statement = database.prepare(`
    INSERT INTO purchase_leads (
      public_id, created_at, updated_at, status, source,
      name, phone, city, comment,
      country, market, lot, car_id, brand, model, year,
      price_foreign, currency, calculated_total_rub,
      page_url, visitor_id,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      referrer, user_agent
    ) VALUES (
      ?, ?, ?, 'NEW', ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `);

  statement.run(
    id,
    now,
    now,
    input.source,
    input.name,
    input.phone,
    input.city || null,
    input.comment || null,
    input.country || null,
    input.market || null,
    input.lot || null,
    input.carId || null,
    input.brand || null,
    input.model || null,
    input.year ?? null,
    input.priceForeign || null,
    input.currency || null,
    input.calculatedTotalRub ?? null,
    input.pageUrl || null,
    input.visitorId || null,
    input.utmSource || null,
    input.utmMedium || null,
    input.utmCampaign || null,
    input.utmContent || null,
    input.utmTerm || null,
    input.referrer || null,
    input.userAgent || null
  );

  return { id, createdAt: now };
}
