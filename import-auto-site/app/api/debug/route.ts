import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export const dynamic = "force-dynamic";

function sh(cmd: string) {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 8000,
    });
  } catch (e: any) {
    return e?.stdout?.toString() || e?.stderr?.toString() || String(e);
  }
}

function file(path: string, max = 20000) {
  try {
    if (!existsSync(path)) return "FILE_NOT_FOUND";
    return readFileSync(path, "utf8").slice(0, max);
  } catch (e) {
    return String(e);
  }
}

export async function GET() {
  const data = {
    checkedAt: new Date().toISOString(),
    system: {
      pwd: process.cwd(),
      node: sh("node -v"),
      npm: sh("npm -v"),
      pm2: sh("pm2 list"),
    },
    git: {
      status: sh("git status --short"),
      branch: sh("git branch --show-current"),
      remote: sh("git remote -v"),
      log: sh("git log --oneline -5"),
    },
    ssh: {
      githubPublicKey: file("/root/.ssh/github_mosaicauto.pub"),
      sshFiles: sh("ls -la /root/.ssh"),
    },
    project: {
      packageJson: file("package.json"),
      nextConfig: file("next.config.ts"),
      catalogFull: file("components/CatalogFull.tsx"),
      mapper: file("lib/catalog/mapper.ts"),
    },
    search: {
      imageFields: sh("grep -R \"previewImage\\|normalizeImages\\|images\\|photo\\|photo2\\|grade\\|rate\" -n app components lib --exclude-dir=.next --exclude-dir=node_modules | head -200"),
    },
  };

  return NextResponse.json(data, { status: 200 });
}
