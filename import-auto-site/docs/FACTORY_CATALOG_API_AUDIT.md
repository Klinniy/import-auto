# Factory Cars catalogue API audit

## Scope

Audited factory catalogue integration for Japanese lots:

- `app/api/catalog/factory/[id]/route.ts`
- `app/api/catalog/factory/detail/route.ts`
- `app/catalog/[id]/page.tsx`
- `app/catalog/factory/[mnfId]/[mdlId]/[rec]/page.tsx`
- `lib/ajes/client.ts`
- Git commits `8a4547a`, `1eb30a8`, `4c78010`, `a77a981`

## Findings

1. The current factory catalogue list route first loads the auction lot through the official AVTO.JP SQL API (`main`, then `stats`) and then used the non-official HTML endpoint `https://auc.mosaicauto.ru/vw?file=loader&op=book...`.
2. The detail route used another non-official HTML endpoint, `https://auc.mosaicauto.ru/catalog?...`.
3. The historical commits that introduced and polished factory catalogue pages already used these `auc.mosaicauto.ru` HTML endpoints; no earlier official Cars catalogue client was found in the inspected history.
4. Repository search did not find `japan/search.php`, `search.php`, a local copy of `https://ajes.com/api/search`, or an official Cars catalogue endpoint implementation.
5. Public supplier documentation confirms that the API offering includes Cars catalogue and that the `API with SEARCH FORM` file from `https://ajes.com/api/search` must be saved locally as `/search.php`. The same documentation describes SQL access to tables such as `main` and `stats`, but does not expose enough public detail in this repository to derive the Cars catalogue request contract safely.

## Decision

The exact official Cars catalogue mechanism cannot be implemented safely without the provider's `search.php` file or explicit endpoint/parameter documentation for Cars catalogue operations.

Therefore this PR does **not** invent a new endpoint and does **not** attempt to bypass HTTP 403 from `auc.mosaicauto.ru`.

## Current behavior after fix

- The list route still verifies that the lot exists through the official AVTO.JP SQL API.
- If the lot is found, factory catalogue routes return a controlled `503` JSON response with `ok:false`, `unavailable:true`, and a public Russian error: `Каталог временно недоступен`.
- Public responses no longer include `rawPreview`, full upstream URLs, or secret values.
- The UI shows `Каталог временно недоступен` instead of silently rendering `ok:true` with `total:0` or `По этому лоту каталог не найден` for upstream unavailability.

## Required provider artifact

Ask the provider for one of the following:

1. the exact `search.php` file copied from `https://ajes.com/api/search`, configured for this account; or
2. explicit Cars catalogue endpoint documentation, including:
   - request path;
   - required auth parameter name;
   - required tables/options for `main`, `stats`, `one`, `korea`, `china`, `bike`, `bike_st`, `hdm`;
   - parameters equivalent to `manuf_id`, `model_id`, `year`, `kuzov`, `grade`, `mileage`, `engine volume`, and detail `rec`;
   - response format examples for list and detail views.

## Staging checks

```bash
cd import-auto-site
npx tsc --noEmit --pretty false
npm run test:audit:calculator:japan
npm run test:route:calculator:japan
npm run build
FACTORY_CATALOG_AUDIT_LOT_ID='<lot-id>' npm run audit:factory:catalog
```

Expected until the official provider file is installed:

- existing lot: HTTP `503`, `ok:false`, `unavailable:true`, safe error `Каталог временно недоступен`;
- missing lot: HTTP `404`, `ok:false`;
- no `rawPreview`, no internal upstream URL, no API key in the JSON response.
