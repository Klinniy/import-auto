import { mkdirSync } from "node:fs";
import path from "node:path";
// Node 22 runtime on MosaicAuto includes the built-in SQLite module.
// @ts-ignore -- project currently uses @types/node 20, which does not declare node:sqlite.
import { DatabaseSync } from "node:sqlite";

export const CRM_LEAD_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "CONTACTED",
  "QUALIFIED",
  "DEAL",
  "CLOSED",
] as const;

export type CrmLeadStatus = (typeof CRM_LEAD_STATUSES)[number];

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

export type CrmPurchaseLead = {
  id: number;
  publicId: string;
  createdAt: string;
  updatedAt: string;
  status: CrmLeadStatus;
  source: string;
  name: string;
  phone: string;
  city: string | null;
  comment: string | null;
  country: string | null;
  market: string | null;
  lot: string | null;
  carId: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  priceForeign: string | null;
  currency: string | null;
  calculatedTotalRub: number | null;
  pageUrl: string | null;
  visitorId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  userAgent: string | null;
};

export type CrmLeadStats = Record<CrmLeadStatus, number> & { TOTAL: number };

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

function rowToLead(row: Record<string, unknown>): CrmPurchaseLead {
  return {
    id: Number(row.id),
    publicId: String(row.public_id || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    status: CRM_LEAD_STATUSES.includes(row.status as CrmLeadStatus)
      ? (row.status as CrmLeadStatus)
      : "NEW",
    source: String(row.source || ""),
    name: String(row.name || ""),
    phone: String(row.phone || ""),
    city: row.city == null ? null : String(row.city),
    comment: row.comment == null ? null : String(row.comment),
    country: row.country == null ? null : String(row.country),
    market: row.market == null ? null : String(row.market),
    lot: row.lot == null ? null : String(row.lot),
    carId: row.car_id == null ? null : String(row.car_id),
    brand: row.brand == null ? null : String(row.brand),
    model: row.model == null ? null : String(row.model),
    year: row.year == null ? null : Number(row.year),
    priceForeign: row.price_foreign == null ? null : String(row.price_foreign),
    currency: row.currency == null ? null : String(row.currency),
    calculatedTotalRub:
      row.calculated_total_rub == null ? null : Number(row.calculated_total_rub),
    pageUrl: row.page_url == null ? null : String(row.page_url),
    visitorId: row.visitor_id == null ? null : String(row.visitor_id),
    utmSource: row.utm_source == null ? null : String(row.utm_source),
    utmMedium: row.utm_medium == null ? null : String(row.utm_medium),
    utmCampaign: row.utm_campaign == null ? null : String(row.utm_campaign),
    utmContent: row.utm_content == null ? null : String(row.utm_content),
    utmTerm: row.utm_term == null ? null : String(row.utm_term),
    referrer: row.referrer == null ? null : String(row.referrer),
    userAgent: row.user_agent == null ? null : String(row.user_agent),
  };
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

export function listPurchaseLeads(options?: {
  search?: string;
  status?: string;
  market?: string;
  limit?: number;
}): CrmPurchaseLead[] {
  const database = openDb();
  const where: string[] = [];
  const params: Array<string | number> = [];
  const search = String(options?.search || "").trim();
  const status = String(options?.status || "").trim();
  const market = String(options?.market || "").trim();
  const limit = Math.min(Math.max(Number(options?.limit || 100), 1), 300);

  if (search) {
    const like = `%${search}%`;
    where.push(`(
      name LIKE ? OR phone LIKE ? OR city LIKE ? OR lot LIKE ? OR
      brand LIKE ? OR model LIKE ? OR public_id LIKE ?
    )`);
    params.push(like, like, like, like, like, like, like);
  }

  if (status && CRM_LEAD_STATUSES.includes(status as CrmLeadStatus)) {
    where.push("status = ?");
    params.push(status);
  }

  if (market === "japan" || market === "china") {
    where.push("market = ?");
    params.push(market);
  }

  const sql = `
    SELECT *
    FROM purchase_leads
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY id DESC
    LIMIT ?
  `;

  params.push(limit);
  const rows = database.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToLead);
}

export function getPurchaseLead(publicId: string): CrmPurchaseLead | null {
  const database = openDb();
  const row = database
    .prepare("SELECT * FROM purchase_leads WHERE public_id = ? LIMIT 1")
    .get(publicId) as Record<string, unknown> | undefined;

  return row ? rowToLead(row) : null;
}

export function updatePurchaseLeadStatus(
  publicId: string,
  status: CrmLeadStatus
): CrmPurchaseLead | null {
  if (!CRM_LEAD_STATUSES.includes(status)) return null;

  const database = openDb();
  const now = new Date().toISOString();
  const result = database
    .prepare("UPDATE purchase_leads SET status = ?, updated_at = ? WHERE public_id = ?")
    .run(status, now, publicId);

  if (!Number(result.changes || 0)) return null;
  return getPurchaseLead(publicId);
}

export function getPurchaseLeadStats(): CrmLeadStats {
  const database = openDb();
  const stats = {
    TOTAL: 0,
    NEW: 0,
    IN_PROGRESS: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    DEAL: 0,
    CLOSED: 0,
  } satisfies CrmLeadStats;

  const rows = database
    .prepare("SELECT status, COUNT(*) AS count FROM purchase_leads GROUP BY status")
    .all() as Array<Record<string, unknown>>;

  for (const row of rows) {
    const status = String(row.status || "") as CrmLeadStatus;
    const count = Number(row.count || 0);
    stats.TOTAL += count;
    if (CRM_LEAD_STATUSES.includes(status)) stats[status] = count;
  }

  return stats;
}
