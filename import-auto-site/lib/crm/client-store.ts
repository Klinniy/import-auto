import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
// @ts-ignore -- Node 22 has node:sqlite, project types are still Node 20.
import { DatabaseSync } from "node:sqlite";
import { getPurchaseLeadDbPath } from "@/lib/leads/store";

export type CrmClientLead = {
  publicId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
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
};

export type CrmClientSummary = {
  phone: string;
  name: string;
  city: string | null;
  leadCount: number;
  latestAt: string;
  latestStatus: string;
  latestCar: string;
  latestMarket: string | null;
};

export type CrmClientNote = {
  publicId: string;
  createdAt: string;
  text: string;
};

export type CrmClientFile = {
  publicId: string;
  createdAt: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

let db: DatabaseSync | null = null;

function openDb() {
  if (db) return db;
  const next = new DatabaseSync(getPurchaseLeadDbPath());
  next.exec("PRAGMA journal_mode = WAL;");
  next.exec("PRAGMA busy_timeout = 5000;");
  next.exec(`
    CREATE TABLE IF NOT EXISTS crm_client_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      client_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      note_text TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_crm_client_notes_client
      ON crm_client_notes(client_key, created_at DESC);

    CREATE TABLE IF NOT EXISTS crm_client_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      client_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_crm_client_files_client
      ON crm_client_files(client_key, created_at DESC);
  `);
  db = next;
  return next;
}

function rowToLead(row: any): CrmClientLead {
  return {
    publicId: row.public_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    source: row.source,
    name: row.name,
    phone: row.phone,
    city: row.city,
    comment: row.comment,
    country: row.country,
    market: row.market,
    lot: row.lot,
    carId: row.car_id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    priceForeign: row.price_foreign,
    currency: row.currency,
    calculatedTotalRub: row.calculated_total_rub,
    pageUrl: row.page_url,
  };
}

export function listCrmClients(search = "", limit = 500): CrmClientSummary[] {
  const database = openDb();
  const rows = database.prepare(`
    SELECT public_id, created_at, updated_at, status, source, name, phone, city,
           comment, country, market, lot, car_id, brand, model, year,
           price_foreign, currency, calculated_total_rub, page_url
    FROM purchase_leads
    ORDER BY created_at DESC
    LIMIT 5000
  `).all() as any[];

  const q = search.trim().toLowerCase();
  const clients = new Map<string, CrmClientSummary>();

  for (const row of rows) {
    const phone = String(row.phone || "").trim();
    if (!phone) continue;

    const haystack = [row.name, phone, row.city, row.brand, row.model, row.lot]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
    if (q && !haystack.includes(q)) continue;

    const current = clients.get(phone);
    if (current) {
      current.leadCount += 1;
      continue;
    }

    clients.set(phone, {
      phone,
      name: String(row.name || "Клиент"),
      city: row.city || null,
      leadCount: 1,
      latestAt: row.created_at,
      latestStatus: row.status,
      latestCar: [row.brand, row.model, row.year].filter(Boolean).join(" ") || "—",
      latestMarket: row.country || row.market || null,
    });
  }

  return Array.from(clients.values()).slice(0, Math.max(1, Math.min(limit, 1000)));
}

export function getCrmClient(phone: string) {
  const database = openDb();
  const leads = database.prepare(`
    SELECT public_id, created_at, updated_at, status, source, name, phone, city,
           comment, country, market, lot, car_id, brand, model, year,
           price_foreign, currency, calculated_total_rub, page_url
    FROM purchase_leads
    WHERE phone = ?
    ORDER BY created_at DESC
  `).all(phone).map(rowToLead);

  if (!leads.length) return null;

  const notes = (database.prepare(`
    SELECT public_id, created_at, note_text
    FROM crm_client_notes
    WHERE client_key = ?
    ORDER BY created_at DESC
  `).all(phone) as any[]).map((row) => ({
    publicId: row.public_id,
    createdAt: row.created_at,
    text: row.note_text,
  } satisfies CrmClientNote));

  const files = (database.prepare(`
    SELECT public_id, created_at, original_name, mime_type, size_bytes
    FROM crm_client_files
    WHERE client_key = ?
    ORDER BY created_at DESC
  `).all(phone) as any[]).map((row) => ({
    publicId: row.public_id,
    createdAt: row.created_at,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
  } satisfies CrmClientFile));

  return {
    phone,
    name: leads[0].name,
    city: leads[0].city,
    leads,
    notes,
    files,
  };
}

export function addCrmClientNote(phone: string, text: string): CrmClientNote {
  const database = openDb();
  const publicId = `note_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  const createdAt = new Date().toISOString();
  database.prepare(`
    INSERT INTO crm_client_notes (public_id, client_key, created_at, note_text)
    VALUES (?, ?, ?, ?)
  `).run(publicId, phone, createdAt, text);
  return { publicId, createdAt, text };
}

function filesRoot() {
  const cwd = process.cwd().replace(/\\/g, "/");
  if (cwd.startsWith("/opt/mosaicauto/staging/")) return "/opt/mosaicauto/runtime/crm-files-staging";
  if (cwd.startsWith("/opt/mosaicauto/site/")) return "/opt/mosaicauto/runtime/crm-files-production";
  return path.join(process.cwd(), ".data", "crm-files");
}

function clientDir(phone: string) {
  const key = crypto.createHash("sha256").update(phone).digest("hex").slice(0, 24);
  return path.join(filesRoot(), key);
}

export function saveCrmClientFile(phone: string, input: { originalName: string; mimeType: string; data: Buffer }) {
  const database = openDb();
  const publicId = `file_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  const createdAt = new Date().toISOString();
  const ext = path.extname(input.originalName).toLowerCase().slice(0, 12);
  const storedName = `${publicId}${ext}`;
  const dir = clientDir(phone);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, storedName), input.data, { flag: "wx" });

  database.prepare(`
    INSERT INTO crm_client_files
      (public_id, client_key, created_at, original_name, stored_name, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(publicId, phone, createdAt, input.originalName, storedName, input.mimeType, input.data.length);

  return {
    publicId,
    createdAt,
    originalName: input.originalName,
    mimeType: input.mimeType,
    sizeBytes: input.data.length,
  } satisfies CrmClientFile;
}

export function readCrmClientFile(phone: string, publicId: string) {
  const database = openDb();
  const row = database.prepare(`
    SELECT original_name, stored_name, mime_type, size_bytes
    FROM crm_client_files
    WHERE client_key = ? AND public_id = ?
  `).get(phone, publicId) as any;
  if (!row) return null;
  return {
    originalName: row.original_name as string,
    mimeType: row.mime_type as string,
    sizeBytes: row.size_bytes as number,
    data: readFileSync(path.join(clientDir(phone), row.stored_name)),
  };
}

export function deleteCrmClientFile(phone: string, publicId: string) {
  const database = openDb();
  const row = database.prepare(`
    SELECT stored_name FROM crm_client_files
    WHERE client_key = ? AND public_id = ?
  `).get(phone, publicId) as any;
  if (!row) return false;

  try {
    unlinkSync(path.join(clientDir(phone), row.stored_name));
  } catch {}

  database.prepare(`DELETE FROM crm_client_files WHERE client_key = ? AND public_id = ?`).run(phone, publicId);
  return true;
}
