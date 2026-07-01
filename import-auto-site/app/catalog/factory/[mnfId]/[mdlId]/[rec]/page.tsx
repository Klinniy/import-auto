import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DetailRow = {
  label: string;
  value: string;
};

type DetailSection = {
  title: string;
  rows: DetailRow[];
};

type DetailPayload = {
  ok: boolean;
  source?: string;
  mnfId?: string;
  mdlId?: string;
  rec?: string;
  sourceUrl?: string;
  title?: string;
  image?: string;
  totalSections?: number;
  sections?: DetailSection[];
  error?: string;
};

type PageProps = {
  params: Promise<{
    mnfId: string;
    mdlId: string;
    rec: string;
  }>;
};

type TranslatedSection = {
  rawTitle: string;
  title: string;
  rows: DetailRow[];
};

type ColorChip = {
  key: string;
  label: string;
  hex: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function catalogKey(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\'’`´]/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/[^a-z0-9а-яё¥/+().-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ruSection(title: string) {
  const key = catalogKey(title);

  const map: Record<string, string> = {
    description: "Основные характеристики",

    "safe equip set": "Средства безопасности",
    "safe equipment": "Средства безопасности",
    "safety equipment": "Средства безопасности",

    "the design of the body providing energy absorption and dispersion of strike":
      "Безопасность кузова",
    "body safety": "Безопасность кузова",

    comfort: "Комфорт",

    sunroof: "Оснащение салона",
    "interior equip": "Оснащение салона",
    "interior equipment": "Оснащение салона",
    "leather seat": "Оснащение салона",
    "leather seats": "Оснащение салона",

    engine: "Двигатель",
    supercharger: "Топливо и расход",
    "steering and suspension": "Рулевое управление и подвеска",
    gearbox: "Коробка передач",

    "additional front headlights": "Наружное оборудование",
    "exterior equipment": "Наружное оборудование",
    "exterier equipment": "Наружное оборудование",
    "exterior equip": "Наружное оборудование",

    navigation: "Навигация, аудио и видео",
    "navigation audio and video": "Навигация, аудио и видео",

    "gear ratio": "Передаточные числа КПП",
    "original car colours": "Цвета кузова",
    "original car colors": "Цвета кузова",
  };

  return map[key] || title;
}

function ruLabel(label: string) {
  const key = catalogKey(label);

  const map: Record<string, string> = {
    modification: "Модификация",
    "chassis id": "Кузов",
    "dates releasing": "Дата выпуска",
    "base price ¥": "Базовая цена, ¥",
    "base price": "Базовая цена, ¥",
    "body size": "Размеры кузова, мм",
    "the size of the passenger compartment lxwxh mm": "Размеры салона, мм",
    "the size of the passenger compartment l x w x h mm": "Размеры салона, мм",
    "wheelbase mm": "Колёсная база, мм",
    "track front / rear wheels mm": "Колея перед/зад, мм",
    "track front rear wheels mm": "Колея перед/зад, мм",
    "full weight kg": "Масса, кг",
    "body type": "Тип кузова",
    "number of doors/seats": "Двери / места",

    "driver's air bag": "Подушка безопасности водителя",
    "driver s air bag": "Подушка безопасности водителя",
    "driver s airbag": "Подушка безопасности водителя",
    "driver air bag": "Подушка безопасности водителя",
    "front passenger air bag": "Подушка безопасности пассажира",
    "leather seat": "Оснащение салона",
    "leather seats": "Оснащение салона",
    "driver's airbag": "Подушка безопасности водителя",
    "drivers air bag": "Подушка безопасности водителя",
    "drivers airbag": "Подушка безопасности водителя",

    "front passenger airbag": "Подушка безопасности пассажира",
    "passenger air bag": "Подушка безопасности пассажира",

    "side airbag": "Боковые подушки безопасности",
    "side airbags": "Боковые подушки безопасности",

    abs: "ABS",
    trc: "TRC",
    tsc: "TSC",

    "safety belts with tensioner": "Ремни с преднатяжителями",
    "safety belts with efforts limiters": "Ремни с ограничителями усилия",
    "safety belts with effort limiters": "Ремни с ограничителями усилия",
    "safety belts with holding": "Ремни с точечным креплением",

    "the mechanism fixation of children's seat": "Крепление детского кресла",
    "the mechanism of fixation of child's seat": "Крепление детского кресла",
    "mechanism fixation of children's seat": "Крепление детского кресла",

    "safety plank": "Защита от бокового удара",
    "safety planks": "Защита от бокового удара",

    "brake assist": "Помощь при торможении",
    ebd: "EBD",
    "anti theft device": "Противоугонная система",
    "the size of the passenger compartment (lxwxh) mm": "Размеры салона, мм",
    "the mechanism of fixation of childrens seats": "Крепление детского кресла",
    "the mechanism fixation of childrens seat": "Крепление детского кресла",
    "the mechanism fixation of childrens seats": "Крепление детского кресла",
    "cruise control": "Круиз-контроль",
    "toned glasses": "Тонированные стёкла",
    "supercharger": "Наддув",
    "cvt": "CVT",

    "air conditioner": "Кондиционер",
    "power window": "Электростеклоподъёмники",
    "electric windows": "Электростеклоподъёмники",
    "central door lock": "Центральный замок",
    "centralized door lock": "Центральный замок",
    "central switch": "Центральный замок",

    "steering column length": "Регулировка руля по вылету",
    "steering column height": "Регулировка руля по высоте",
    "finishing leather steering wheel": "Кожаная отделка руля",
    "remote control key": "Дистанционный ключ",

    "power front seat": "Электропривод передних сидений",
    "power rear seat": "Электропривод задних сидений",
    "wood panel": "Декоративные вставки",
    sunroof: "Люк",
    "alloy wheels": "Литые диски",
    "folding seat": "Складные сиденья",
    "glass with a uv filter": "Стёкла с UV-фильтром",
    "toned glass": "Тонированные стёкла",

    model: "Модель двигателя",
    type: "Тип",
    "bore x course of the piston mm": "Диаметр цилиндра x ход поршня, мм",
    "engine size": "Объём двигателя, см³",
    "compression ratio": "Степень сжатия",
    "fuel injection system": "Система впрыска топлива",
    "maximum power hp / t.min.": "Максимальная мощность, л.с.",
    "maximum power hp / t min": "Максимальная мощность, л.с.",
    "maximum torque nm / rpm": "Максимальный момент, Нм / об/мин",

    "fuel tank capacity liters": "Объём топливного бака, л",
    fuel: "Топливо",
    "fuel consumption l/100 km": "Расход топлива, л/100 км",

    steering: "Рулевой механизм",
    "front suspension": "Передняя подвеска",
    "rear suspension": "Задняя подвеска",
    "front brake": "Передние тормоза",
    "rear brake": "Задние тормоза",
    "front wheel": "Передние шины",
    "rear wheel": "Задние шины",
    "the minimum diameter of a turn": "Минимальный радиус разворота, м",

    "number of steps / type": "Тип КПП",
    drive: "Привод",

    "front fog lights": "Передние противотуманные фары",
    "rear fog lights": "Задние противотуманные фары",
    "xenon headlights": "Ксеноновые фары",
    "additional front headlights": "Дополнительные передние фары",
    "front / rear spoiler": "Передний / задний спойлер",
    "rear wiper": "Задний дворник",

    navigation: "Навигация",
    "navigational device": "Навигационное устройство",

  };

  return map[key] || label;
}


function normalizeValue(label: string, value: string) {
  const raw = cleanText(value)
    .replace(/DBA-\s+/g, "DBA-")
    .replace(/\bdoor\b/gi, "дверей")
    .replace(/\bl\b$/i, "л")
    .replace(/REVERSE/gi, "R")
    .replace(/Final drive/gi, "Главная передача");

  const key = catalogKey(raw);
  const labelKey = catalogKey(label);

  if (!raw || raw === "/" || raw === "-") return "—";

  if (labelKey === "number of doors/seats" && /\d+\s*\/\s*\d+/.test(raw)) {
    const match = raw.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) return `${match[1]} двери / ${match[2]} мест`;
  }

  const valueMap: Record<string, string> = {
    exist: "Есть",
    exists: "Есть",
    yes: "Есть",
    no: "Нет",
    unknown: "Неизвестно",
    manual: "Ручной",
    "regular (92)": "Регуляр (92)",
    disk: "Дисковые",
    drum: "Барабанные",
    "kei car": "Кей-кар",
    "option settings no": "Опция, не в базе",
    "power assist equipped rack&pinion": "Реечное с электроусилителем",
    "power assist equipped rack pinion": "Реечное с электроусилителем",
    "mcpherson strut type coil spring": "МакФерсон, винтовая пружина",
    itl: "ITL",
    ff: "FF",
    cvt: "CVT",
    "water cooling inline 3 cylinder dohc 12-valves":
      "Рядный 3-цилиндровый DOHC 12V с жидкостным охлаждением",
    "electronic fuel injection": "Электронный впрыск топлива",
    "電子制御燃料噴射装置": "Электронный впрыск топлива",
  };

  if (valueMap[key]) return valueMap[key];

  if (labelKey === "fuel injection system" && /電子|electronic/i.test(raw)) {
    return "Электронный впрыск топлива";
  }

  if (/^exist$/i.test(raw)) return "Есть";
  if (/^no$/i.test(raw)) return "Нет";
  if (/^unknown$/i.test(raw)) return "Неизвестно";

  return raw;
}

function findValue(sections: DetailSection[], labels: string[]) {
  const wanted = labels.map((item) => catalogKey(item));
  for (const section of sections || []) {
    for (const row of section.rows || []) {
      if (wanted.includes(catalogKey(row.label))) {
        return cleanText(row.value);
      }
    }
  }
  return "";
}

const COLOR_CATALOG: ColorChip[] = [
  { key: "other white", label: "Другой белый", hex: "#F5F5F5" },
  { key: "white", label: "Белый", hex: "#FFFFFF" },
  { key: "black", label: "Чёрный", hex: "#111111" },
  { key: "green", label: "Зелёный", hex: "#3E8E41" },
  { key: "maroon (brown)", label: "Бордовый (коричневый)", hex: "#6B2D2C" },
  { key: "olive", label: "Оливковый", hex: "#808000" },
  { key: "navy blue", label: "Тёмно-синий", hex: "#1F3A93" },
  { key: "purple", label: "Пурпурный", hex: "#7E57C2" },
  { key: "ashes yellow", label: "Пепельно-жёлтый", hex: "#D7C46A" },
  { key: "yellow-green", label: "Жёлто-зелёный", hex: "#9ACD32" },
  { key: "other black (p)", label: "Другой чёрный (P)", hex: "#2C2C2C" },
  { key: "black (p)", label: "Чёрный (P)", hex: "#1A1A1A" },
  { key: "other magenta", label: "Другой пурпурный", hex: "#B83280" },
  { key: "magenta", label: "Пурпурный", hex: "#D81B60" },
  { key: "silver metallic", label: "Серебристый металлик", hex: "#B0BEC5" },
  { key: "other red", label: "Другой красный", hex: "#C62828" },
  { key: "red", label: "Красный", hex: "#E53935" },
  { key: "blue", label: "Голубой", hex: "#4A6CF7" },
  { key: "dark cyan", label: "Тёмно-бирюзовый", hex: "#008B8B" },
  { key: "pearl gold", label: "Перламутровый золотой", hex: "#C8A951" },
  { key: "gold", label: "Золотой", hex: "#C9A227" },
];

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractColorChips(section: TranslatedSection) {
  const source = section.rows
    .map((row) => `${row.label} ${row.value}`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = catalogKey(source);
  const found: { index: number; chip: ColorChip }[] = [];

  for (const chip of [...COLOR_CATALOG].sort((a, b) => b.key.length - a.key.length)) {
    const regex = new RegExp(`(^| )${escapeRegExp(chip.key)}(?= |$)`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(normalized)) !== null) {
      found.push({ index: match.index, chip });
    }
  }

  found.sort((a, b) => a.index - b.index);

  const unique: ColorChip[] = [];
  const used = new Set<string>();
  for (const item of found) {
    if (!used.has(item.chip.key)) {
      unique.push(item.chip);
      used.add(item.chip.key);
    }
  }

  return unique;
}

function isWideSection(title: string) {
  const key = catalogKey(title);
  return key === "передаточные числа кпп" || key === "цвета кузова";
}

function SectionCard({ section }: { section: TranslatedSection }) {
  const wide = isWideSection(section.title);
  const colorSection = catalogKey(section.title) === "цвета кузова";
  const colorChips = colorSection ? extractColorChips(section) : [];

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#07152f] px-4 py-3">
        <h2 className="text-sm font-black text-white">{section.title}</h2>
        <div className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-black text-white">
          {section.rows.length}
        </div>
      </div>

      {colorSection ? (
        <div className="p-4">
          {colorChips.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {colorChips.map((chip) => (
                <div
                  key={chip.key}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span
                    className="h-5 w-5 rounded-md border border-slate-300 shadow-sm"
                    style={{ backgroundColor: chip.hex }}
                    title={chip.label}
                  />
                  <span className="text-xs font-bold text-slate-800">{chip.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-500">Цвета не указаны.</div>
          )}
        </div>
      ) : (
        <div className={wide ? "grid gap-0 md:grid-cols-2" : "divide-y divide-slate-100"}>
          {section.rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className={`grid grid-cols-[1.2fr_1fr] gap-3 px-4 py-2 text-sm ${
                wide ? "border-b border-slate-100 last:border-b-0" : ""
              }`}
            >
              <div className="text-slate-500">{row.label}</div>
              <div className="font-semibold text-slate-900">{row.value}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InfoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#07152f] ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function SummaryBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/8 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.08em] text-white/60">
        {title}
      </div>
      <div className="mt-1 text-sm font-black text-white">{value || "—"}</div>
    </div>
  );
}

export default async function FactoryDetailPage({ params }: PageProps) {
  const { mnfId, mdlId, rec } = await params;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "mosaicauto.ru";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  const apiUrl = `${origin}/api/catalog/factory/detail?mnf_id=${encodeURIComponent(
    mnfId
  )}&mdl_id=${encodeURIComponent(mdlId)}&rec=${encodeURIComponent(rec)}`;

  const response = await fetch(apiUrl, { cache: "no-store" });
  const payload = (await response.json()) as DetailPayload;

  if (!payload?.ok) {
    return (
      <main className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить данные модификации: {payload?.error || "неизвестная ошибка"}
        </div>
      </main>
    );
  }

  const rawSections = payload.sections || [];
  const sections: TranslatedSection[] = rawSections.map((section) => ({
    rawTitle: ruSection(section.title),
    title: ruSection(section.title),
    rows: (section.rows || []).map((row) => ({
      label: ruLabel(row.label),
      value: normalizeValue(row.label, row.value),
    })),
  }));

  const modification = normalizeValue("Modification", findValue(rawSections, ["Modification"]));
  const chassis = normalizeValue("Chassis ID", findValue(rawSections, ["Chassis ID"]));
  const release = normalizeValue("Dates releasing", findValue(rawSections, ["Dates releasing"]));
  const engine = normalizeValue("Model", findValue(rawSections, ["Model"]));
  const engineSize = normalizeValue("Engine Size", findValue(rawSections, ["Engine Size"]));
  const gearbox = normalizeValue(
    "Number of steps / Type",
    findValue(rawSections, ["Number of steps / Type"])
  );
  const drive = normalizeValue("Drive", findValue(rawSections, ["Drive"]));
  const fuel = normalizeValue("Fuel", findValue(rawSections, ["Fuel"]));
  const consumption = normalizeValue(
    "Fuel consumption, l/100 km",
    findValue(rawSections, ["Fuel consumption, l/100 km"])
  );
  const basePrice = normalizeValue("Base price, ¥", findValue(rawSections, ["Base price, ¥"]));

  const titleParts = cleanText(payload.title).split("/").map((item) => item.trim()).filter(Boolean);
  const brand = titleParts[0] || "";
  const model = titleParts[1] || "";

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/catalog"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#07152f] shadow-sm hover:bg-slate-50"
        >
          ← Назад к лоту
        </Link>

        <Link
          href="/catalog"
          className="inline-flex items-center rounded-full bg-[#07152f] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#0b2248]"
        >
          В каталог
        </Link>
      </div>

      <section className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff2d3d]">
              Заводской каталог
            </div>

            <div className="flex h-[160px] items-center justify-center rounded-2xl bg-slate-50 p-3">
              {payload.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={payload.image}
                  alt={model || "Модификация"}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-sm text-slate-400">Нет изображения</div>
              )}
            </div>
          </div>

          <div className="bg-[#07152f] p-4 text-white">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5c6b]">
              Подробности модификации
            </div>

            <h1 className="mb-3 text-3xl font-black leading-none md:text-5xl">
              {brand} {model} {modification}
            </h1>

            <div className="mb-4 flex flex-wrap gap-2">
              {chassis && <InfoBadge>{chassis}</InfoBadge>}
              {release && <InfoBadge>{release}</InfoBadge>}
              <InfoBadge>REC {rec}</InfoBadge>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <SummaryBox title="Двигатель" value={`${engine}${engineSize ? ` / ${engineSize} см³` : ""}`} />
              <SummaryBox title="КПП" value={gearbox} />
              <SummaryBox title="Привод" value={drive} />
              <SummaryBox title="Цена" value={basePrice} />
              <SummaryBox title="Топливо" value={fuel} />
              <SummaryBox title="Расход" value={consumption ? `${consumption} л/100 км` : "—"} />
              <SummaryBox title="Марка" value={brand} />
              <SummaryBox title="Модель" value={model} />
            </div>

            <div className="mt-4 rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium text-white/90">
              Здесь собраны заводские характеристики выбранной модификации: кузов, двигатель,
              КПП, привод, размеры, расход топлива, подвеска и оснащение.
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section, idx) => (
          <SectionCard key={`${section.title}-${idx}`} section={section} />
        ))}
      </div>
    </main>
  );
}
