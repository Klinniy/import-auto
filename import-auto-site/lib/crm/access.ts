import { headers } from "next/headers";

function normalizeHost(value: string | null) {
  return String(value || "").split(":")[0].trim().toLowerCase();
}

export function isCrmRequestAllowedFromHeaders(input: Headers) {
  if (input.get("x-mosaicauto-crm") === "1") return true;

  const host = normalizeHost(input.get("host"));

  // Staging is already protected by HTTP Basic Auth, so /crm can be tested there
  // before the dedicated crm-staging.mosaicauto.ru vhost is enabled.
  if (host === "staging.mosaicauto.ru" || host === "crm-staging.mosaicauto.ru") {
    return true;
  }

  if (host === "localhost" || host === "127.0.0.1") return true;

  return false;
}

export async function isCrmPageRequestAllowed() {
  const requestHeaders = await headers();
  return isCrmRequestAllowedFromHeaders(requestHeaders);
}
