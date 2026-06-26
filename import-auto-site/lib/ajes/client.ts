const AJ_API_CODE = process.env.AJ_API_CODE || "";
const AJ_API_SERVER = process.env.AJ_API_SERVER || "87.242.72.57";
const AJ_API_IP = process.env.AJ_API_IP || "8.1.1.1";

export type AjesRow = Record<string, string>;

export function sqlValue(value: string) {
  return "'" + String(value).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
}

export function sqlLike(value: string) {
  return "'%" + String(value).replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/%/g, "\\%").replace(/_/g, "\\_") + "%'";
}

export function toInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function ajesSql<T = AjesRow[]>(sql: string): Promise<T> {
  if (!AJ_API_CODE) {
    throw new Error("AJ_API_CODE is not set");
  }

  const url =
    `http://${AJ_API_SERVER}/api/?ip=${encodeURIComponent(AJ_API_IP)}` +
    `&json&code=${encodeURIComponent(AJ_API_CODE)}` +
    `&sql=${encodeURIComponent(sql)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "MosaicAuto/1.0"
    }
  });

  const text = await res.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("AJES returned non-JSON response: " + text.slice(0, 300));
  }

  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: unknown }).error));
  }

  return data as T;
}

export function normalizeImages(images?: string) {
  return String(images || "")
    .split("#")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((url) => ({
      original: url.replace(/&[hw]=\d+$/i, ""),
      preview: url.replace(/&[hw]=\d+$/i, "") + "&h=50",
      medium: url.replace(/&[hw]=\d+$/i, "") + "&w=320"
    }));
}
