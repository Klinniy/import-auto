"use client";

import { useEffect, useState } from "react";
import CatalogFull from "@/components/CatalogFull";

declare global {
  interface Window {
    __mosaicautoOriginalFetch?: typeof fetch;
    __mosaicautoChinaFetchInstalled?: boolean;
  }
}

function isChinaPageRuntime(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.location.pathname === "/china" ||
    window.location.pathname.startsWith("/china/")
  );
}

function rewriteChinaUrl(rawUrl: string): string {
  if (typeof window === "undefined") return rawUrl;
  if (!isChinaPageRuntime()) return rawUrl;

  let url: URL;

  try {
    url = new URL(rawUrl, window.location.origin);
  } catch {
    return rawUrl;
  }

  if (url.origin !== window.location.origin) {
    return rawUrl;
  }

  const map: Record<string, string> = {
    "/api/catalog": "/api/china/catalog",

    "/api/brands": "/api/china/brands",
    "/api/models": "/api/china/models",
    "/api/filters": "/api/china/filters",

    "/api/catalog/filters": "/api/china/catalog/filters",
    "/api/catalog/facets": "/api/china/catalog/facets",

    "/api/statistics/facets": "/api/china/catalog/facets",
    "/api/statistics/filters": "/api/china/catalog/filters",
    "/api/statistics/models": "/api/china/models",
  };

  if (map[url.pathname]) {
    url.pathname = map[url.pathname];
    url.searchParams.set("market", "china");
    url.searchParams.set("source", "china");
  }

  if (rawUrl.startsWith("/")) {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return url.toString();
}

function installChinaFetchPatch() {
  if (typeof window === "undefined") return;
  if (window.__mosaicautoChinaFetchInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.__mosaicautoOriginalFetch = originalFetch;
  window.__mosaicautoChinaFetchInstalled = true;

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        return originalFetch(rewriteChinaUrl(input), init);
      }

      if (input instanceof URL) {
        return originalFetch(rewriteChinaUrl(input.toString()), init);
      }

      if (input instanceof Request) {
        const rewrittenUrl = rewriteChinaUrl(input.url);
        const rewrittenRequest = new Request(rewrittenUrl, input);
        return originalFetch(rewrittenRequest, init);
      }
    } catch {
      return originalFetch(input as any, init);
    }

    return originalFetch(input as any, init);
  }) as typeof fetch;
}

export default function ChinaCatalogExactClone() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installChinaFetchPatch();
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return <CatalogFull />;
}
