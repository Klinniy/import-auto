import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FileInfo = {
  path: string;
  size: number;
  lines: number;
  preview: string;
};

const ROOT = process.cwd();

function safeRelative(filePath: string) {
  return filePath.replace(ROOT + path.sep, "").replaceAll("\\", "/");
}

function exists(relPath: string) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readPreview(relPath: string, maxLines = 220): FileInfo | null {
  const abs = path.join(ROOT, relPath);

  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return null;
  }

  const text = fs.readFileSync(abs, "utf-8");
  const lines = text.split(/\r?\n/);

  return {
    path: relPath,
    size: Buffer.byteLength(text, "utf-8"),
    lines: lines.length,
    preview: lines.slice(0, maxLines).join("\n"),
  };
}

function walk(dirRel: string, maxDepth = 5) {
  const result: string[] = [];
  const start = path.join(ROOT, dirRel);

  function scan(current: string, depth: number) {
    if (depth > maxDepth || !fs.existsSync(current)) return;

    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === "build"
      ) {
        continue;
      }

      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        scan(full, depth + 1);
        continue;
      }

      if (entry.isFile()) {
        const rel = safeRelative(full);

        if (/\.(tsx|ts|css|scss|json|md)$/.test(rel)) {
          result.push(rel);
        }
      }
    }
  }

  scan(start, 0);

  return result.sort();
}

function gitStatus() {
  try {
    return execFileSync("git", ["status", "--short"], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    }).trim();
  } catch (error) {
    return String(error);
  }
}

function packageInfo() {
  const pkg = readPreview("package.json", 120);

  if (!pkg) return null;

  try {
    const json = JSON.parse(pkg.preview);

    return {
      name: json.name,
      version: json.version,
      scripts: json.scripts || {},
      dependencies: json.dependencies || {},
    };
  } catch {
    return {
      raw: pkg.preview,
    };
  }
}

function pickCatalogFiles(files: string[]) {
  return files.filter((file) => {
    const lower = file.toLowerCase();

    return (
      lower.includes("catalog") ||
      lower.includes("car") ||
      lower.includes("filter") ||
      lower.includes("vehicle") ||
      lower.includes("auto")
    );
  });
}

export async function GET() {
  const appFiles = walk("app", 6);
  const componentFiles = walk("components", 6);
  const libCatalogFiles = walk("lib/catalog", 6);

  const importantPaths = [
    "app/page.tsx",
    "app/layout.tsx",
    "app/globals.css",
    "app/catalog/page.tsx",
    "app/catalog/loading.tsx",
    "app/catalog/error.tsx",
  ];

  const catalogComponentFiles = pickCatalogFiles(componentFiles);

  const importantExisting = importantPaths
    .filter(exists)
    .map((file) => readPreview(file, 260))
    .filter(Boolean);

  const catalogComponentPreviews = catalogComponentFiles
    .slice(0, 30)
    .map((file) => readPreview(file, 220))
    .filter(Boolean);

  const summary = {
    appFilesCount: appFiles.length,
    componentFilesCount: componentFiles.length,
    libCatalogFilesCount: libCatalogFiles.length,
    hasHomePage: exists("app/page.tsx"),
    hasCatalogPage: exists("app/catalog/page.tsx"),
    hasCatalogComponents: catalogComponentFiles.length > 0,
    catalogComponentFilesCount: catalogComponentFiles.length,
  };

  return NextResponse.json({
    ok: true,
    version: "UI SCAN V1",
    checkedAt: new Date().toISOString(),
    cwd: ROOT,
    summary,
    gitStatus: gitStatus(),
    package: packageInfo(),
    files: {
      app: appFiles,
      components: componentFiles,
      catalogComponents: catalogComponentFiles,
      libCatalog: libCatalogFiles,
    },
    previews: {
      important: importantExisting,
      catalogComponents: catalogComponentPreviews,
    },
    nextStep: {
      instruction:
        "Скопируй этот JSON из Debug Center. По нему правим существующую главную и каталог точечно, без перезаписи сайта с нуля.",
    },
  });
}
