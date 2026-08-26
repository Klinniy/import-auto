// @ts-ignore -- Node 22 has node:sqlite, project types are still Node 20.
import { DatabaseSync } from "node:sqlite";
import { getPurchaseLeadDbPath } from "@/lib/leads/store";

export type CrmClientSearchFilters = {
  phone?: string;
  name?: string;
  city?: string;
};

export type CrmClientSearchSummary = {
  phone: string;
  name: string;
  city: string | null;
  leadCount: number;
  latestAt: string;
  latestStatus: string;
  latestCar: string;
  latestMarket: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export function listCrmClientsFiltered(
  filters: CrmClientSearchFilters = {},
  limit = 500
): CrmClientSearchSummary[] {
  const database = new DatabaseSync(getPurchaseLeadDbPath());
  database.exec("PRAGMA busy_timeout = 5000;");

  try {
    const rows = database.prepare(`
      SELECT created_at, status, name, phone, city, country, market, brand, model, year
      FROM purchase_leads
      ORDER BY created_at DESC
      LIMIT 10000
    `).all() as any[];

    const grouped = new Map<
      string,
      {
        summary: CrmClientSearchSummary;
        names: Set<string>;
        cities: Set<string>;
      }
    >();

    for (const row of rows) {
      const phone = String(row.phone || "").trim();
      if (!phone) continue;

      const name = String(row.name || "Клиент").trim() || "Клиент";
      const city = String(row.city || "").trim();
      const current = grouped.get(phone);

      if (current) {
        current.summary.leadCount += 1;
        if (name) current.names.add(normalizeText(name));
        if (city) current.cities.add(normalizeText(city));
        continue;
      }

      grouped.set(phone, {
        summary: {
          phone,
          name,
          city: city || null,
          leadCount: 1,
          latestAt: row.created_at,
          latestStatus: row.status,
          latestCar: [row.brand, row.model, row.year].filter(Boolean).join(" ") || "—",
          latestMarket: row.country || row.market || null,
        },
        names: new Set(name ? [normalizeText(name)] : []),
        cities: new Set(city ? [normalizeText(city)] : []),
      });
    }

    const phoneQuery = normalizePhone(filters.phone);
    const nameQuery = normalizeText(filters.name);
    const cityQuery = normalizeText(filters.city);

    return Array.from(grouped.values())
      .filter(({ summary, names, cities }) => {
        if (phoneQuery && !normalizePhone(summary.phone).includes(phoneQuery)) return false;
        if (nameQuery && !Array.from(names).some((value) => value.includes(nameQuery))) return false;
        if (cityQuery && !Array.from(cities).some((value) => value.includes(cityQuery))) return false;
        return true;
      })
      .map(({ summary }) => summary)
      .slice(0, Math.max(1, Math.min(Number(limit) || 500, 1000)));
  } finally {
    database.close();
  }
}
