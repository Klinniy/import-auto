import { existsSync, readFileSync } from "node:fs";

export type AjesRow = Record<string, string>;

type EnvPick = {
  value: string;
  source: "runtime" | "file" | "default" | "missing";
  key: string | null;
};

function parseEnvLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
    return null;
  }

  const key = trimmed.slice(0, trimmed.indexOf("=")).trim();
  let value = trimmed.slice(trimmed.indexOf("=") + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function readEnvFileValue(keys: string[]) {
  const files = [".env.local", ".env.production.local", ".env.production", ".env"];

  for (const file of files) {
    if (!existsSync(file)) continue;

    const text = readFileSync(file, "utf8");

    for (const line of text.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;

      if (keys.includes(parsed.key) && parsed.value) {
        return {
          key: parsed.key,
          value: parsed.value,
        };
      }
    }
  }

  return null;
}

function pickEnv(keys: string[], fallback = ""): EnvPick {
  for (const key of keys) {
    const value = process.env[key];

    if (value) {
      return {
        value,
        source: "runtime",
        key,
      };
    }
  }

  const fileValue = readEnvFileValue(keys);

  if (fileValue) {
    return {
      value: fileValue.value,
      source: "file",
      key: fileValue.key,
    };
  }

  if (fallback) {
    return {
      value: fallback,
      source: "default",
      key: null,
    };
  }

  return {
    value: "",
    source: "missing",
    key: null,
  };
}

function normalizeServer(value: string) {
  let server = String(value || "").trim();

  server = server.replace(/^https?:\/\//i, "");
  server = server.replace(/\/api\/?.*$/i, "");
  server = server.replace(/\/gzip\/?.*$/i, "");
  server = server.replace(/\/+$/g, "");

  return server || "87.242.72.57";
}

const CODE_PICK = pickEnv(["AJ_API_CODE", "AJ_CODE", "AVTOJP_API_KEY", "AVTOJP_CODE"]);
const SERVER_PICK = pickEnv([
  "AJ_API_SERVER",
  "AJ_API",
  "AVTOJP_API_SERVER",
  "AVTOJP_API_BASE_URL",
], "87.242.72.57");
const IP_PICK = pickEnv(["AJ_API_IP", "AJ_IP"], "8.1.1.1");

const AJ_API_CODE = CODE_PICK.value;
const AJ_API_SERVER = normalizeServer(SERVER_PICK.value);
const AJ_API_IP = IP_PICK.value;

export function getAjesRuntimeConfig() {
  return {
    codeConfigured: Boolean(AJ_API_CODE),
    codeLength: AJ_API_CODE.length,
    codeSource: CODE_PICK.source,
    codeKey: CODE_PICK.key,

    serverConfigured: Boolean(AJ_API_SERVER),
    server: AJ_API_SERVER,
    serverSource: SERVER_PICK.source,
    serverKey: SERVER_PICK.key,

    ip: AJ_API_IP,
    ipSource: IP_PICK.source,
    ipKey: IP_PICK.key,
  };
}

export function sqlValue(value: string) {
  return "'" + String(value).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
}

export function sqlLike(value: string) {
  return "'%" + String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_") + "%'";
}

export function toInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number(value);

  if (!Number.isFinite(n)) return fallback;

  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function ajesSql<T = AjesRow[]>(sql: string): Promise<T> {
  if (!AJ_API_CODE) {
    throw new Error(
      "AJES API code is not set. Expected one of: AJ_API_CODE, AJ_CODE, AVTOJP_API_KEY"
    );
  }

  const url =
    `http://${AJ_API_SERVER}/api/?ip=${encodeURIComponent(AJ_API_IP)}` +
    `&json&code=${encodeURIComponent(AJ_API_CODE)}` +
    `&sql=${encodeURIComponent(sql)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "MosaicAuto/1.0",
    },
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
      medium: url.replace(/&[hw]=\d+$/i, "") + "&w=320",
    }));
}


export async function ajesRawApi(path: string, params: Record<string, string>) {
  if (!AJ_API_CODE) {
    throw new Error(
      "AJES API code is not set. Expected one of: AJ_API_CODE, AJ_CODE, AVTOJP_API_KEY"
    );
  }

  const search = new URLSearchParams();

  search.set("code", AJ_API_CODE);

  for (const [key, value] of Object.entries(params)) {
    search.set(key, value);
  }

  const cleanPath = String(path || "").replace(/^\/+/, "");
  const url = `http://${AJ_API_SERVER}/${cleanPath}?${search.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "MosaicAuto/1.0",
    },
  });

  const text = await res.text();

  let json: unknown = null;

  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    url: url.replace(AJ_API_CODE, "***"),
    contentType: res.headers.get("content-type") || "",
    textPreview: text.slice(0, 5000),
    json,
  };
}
