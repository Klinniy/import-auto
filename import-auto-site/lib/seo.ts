export const SITE_NAME = "MosaicAuto";
export const SITE_URL = "https://mosaicauto.ru";
export const MANAGER_PHONE = "+7 916 712-73-06";
export const MANAGER_PHONE_E164 = "+79167127306";
export const MAX_URL = "https://max.ru/u/f9LHodD0cOI_qf3LXsnjJrhrQP1KGWSV8M01vyrAEtwN22MUaYWCjDGCd6U";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/brand/mosaicauto-logo.svg"),
  contactPoint: {
    "@type": "ContactPoint",
    telephone: MANAGER_PHONE_E164,
    contactType: "customer service",
    areaServed: "RU",
    availableLanguage: "ru",
  },
  sameAs: [MAX_URL],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "ru-RU",
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

type CarSeoInput = {
  name: string;
  path: string;
  lot?: string | number | null;
  brand?: string | null;
  model?: string | null;
  year?: string | number | null;
  mileage?: string | number | null;
  engineVolume?: string | number | null;
  transmission?: string | null;
  drive?: string | null;
  color?: string | null;
  image?: string | null;
  auction?: string | null;
  grade?: string | number | null;
};

function positiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function carJsonLd(input: CarSeoInput) {
  const mileage = positiveNumber(input.mileage);
  const engineVolume = positiveNumber(input.engineVolume);
  const additionalProperty = [
    input.lot ? { "@type": "PropertyValue", name: "Лот", value: String(input.lot) } : null,
    input.auction ? { "@type": "PropertyValue", name: "Площадка", value: String(input.auction) } : null,
    input.grade ? { "@type": "PropertyValue", name: "Оценка", value: String(input.grade) } : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: input.name,
    url: absoluteUrl(input.path),
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.brand ? { brand: { "@type": "Brand", name: String(input.brand) } } : {}),
    ...(input.model ? { model: String(input.model) } : {}),
    ...(input.year ? { vehicleModelDate: String(input.year) } : {}),
    ...(mileage
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: mileage,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(engineVolume
      ? {
          vehicleEngine: {
            "@type": "EngineSpecification",
            engineDisplacement: {
              "@type": "QuantitativeValue",
              value: engineVolume,
              unitText: "см³",
            },
          },
        }
      : {}),
    ...(input.transmission ? { vehicleTransmission: String(input.transmission) } : {}),
    ...(input.drive ? { driveWheelConfiguration: String(input.drive) } : {}),
    ...(input.color ? { color: String(input.color) } : {}),
    ...(input.lot ? { sku: String(input.lot) } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
  };
}
