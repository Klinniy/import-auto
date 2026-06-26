import { NextRequest, NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import { getAjesRuntimeConfig } from "@/lib/ajes/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function run(cmd: string) {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 7000,
    }).trim();
  } catch (error: any) {
    return String(error?.stdout || error?.stderr || error?.message || error).slice(0, 3000);
  }
}

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

  return {
    key,
    valueLength: value.length,
    hasValue: Boolean(value),
  };
}

function envFiles() {
  const files = [".env", ".env.local", ".env.production", ".env.production.local"];

  return files.map((file) => {
    if (!existsSync(file)) {
      return {
        file,
        exists: false,
        keys: [],
        values: {},
      };
    }

    const values: Record<string, { hasValue: boolean; valueLength: number }> = {};
    const text = readFileSync(file, "utf8");

    for (const line of text.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;

      values[parsed.key] = {
        hasValue: parsed.hasValue,
        valueLength: parsed.valueLength,
      };
    }

    const keys = Object.keys(values);

    return {
      file,
      exists: true,
      keys,
      values,
      hasAjCode: Boolean(values.AJ_CODE?.hasValue),
      hasAjApiCode: Boolean(values.AJ_API_CODE?.hasValue),
      hasAjApiServer: Boolean(values.AJ_API_SERVER?.hasValue),
      hasAjApi: Boolean(values.AJ_API?.hasValue),
      hasAvtojpApiKey: Boolean(values.AVTOJP_API_KEY?.hasValue),
      hasDatabaseUrl: Boolean(values.DATABASE_URL?.hasValue),
      hasJwtSecret: Boolean(values.JWT_SECRET?.hasValue),
    };
  });
}

function runtimeEnv(name: string) {
  const value = process.env[name];

  return {
    configured: Boolean(value),
    length: value ? value.length : 0,
  };
}

function localBaseUrl() {
  const port = process.env.PORT || "3000";

  return process.env.DEBUG_INTERNAL_BASE_URL || `http://127.0.0.1:${port}`;
}

async function checkEndpoint(baseUrl: string, path: string) {
  const started = Date.now();

  try {
    const res = await fetch(baseUrl + path, {
      cache: "no-store",
    });

    const text = await res.text();

    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      url: baseUrl + path,
      preview: text.slice(0, 2200),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      url: baseUrl + path,
      error: String(error),
    };
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const url = new URL(req.url);
  const smoke = url.searchParams.get("smoke") === "1";
  const baseUrl = localBaseUrl();

  const data: any = {
    ok: true,
    version: "DEBUG CENTER V2.3",
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - started,

    server: {
      cwd: process.cwd(),
      node: process.version,
      platform: process.platform,
      hostname: os.hostname(),
      uptimeSec: Math.round(process.uptime()),
      cpus: os.cpus().length,
      totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemMb: Math.round(os.freemem() / 1024 / 1024),
      internalBaseUrl: baseUrl,
    },

    envRuntime: {
      NODE_ENV: process.env.NODE_ENV || null,
      PORT: process.env.PORT || null,

      DATABASE_URL: runtimeEnv("DATABASE_URL"),
      JWT_SECRET: runtimeEnv("JWT_SECRET"),

      AJ_CODE: runtimeEnv("AJ_CODE"),
      AJ_API_CODE: runtimeEnv("AJ_API_CODE"),
      AJ_API_SERVER: runtimeEnv("AJ_API_SERVER"),
      AJ_API: runtimeEnv("AJ_API"),

      AVTOJP_API_KEY: runtimeEnv("AVTOJP_API_KEY"),
      AVTOJP_API_BASE_URL: runtimeEnv("AVTOJP_API_BASE_URL"),
    },

    envFiles: envFiles(),

    ajesEffectiveConfig: getAjesRuntimeConfig(),

    git: {
      branch: run("git rev-parse --abbrev-ref HEAD"),
      commit: run("git rev-parse --short HEAD"),
      status: run("git status --short") || "clean",
    },

    pm2: run("pm2 status --no-color"),

    routes: {
      debug: "/debug",
      apiDebug: "/api/debug",
      smoke: "/api/debug?smoke=1",
      summary: "/summary.json",
      brands: "/api/brands",
      catalog: "/api/catalog?page=1&limit=3",
      currency: "/api/currency",
    },
  };

  if (smoke) {
    data.smoke = {
      brands: await checkEndpoint(baseUrl, "/api/brands"),
      catalog: await checkEndpoint(baseUrl, "/api/catalog?page=1&limit=3"),
      currency: await checkEndpoint(baseUrl, "/api/currency"),
    };
  }

  return NextResponse.json(data);
}
