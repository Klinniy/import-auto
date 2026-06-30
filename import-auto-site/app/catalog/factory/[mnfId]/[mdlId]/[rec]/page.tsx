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
  ok?: boolean;
  title?: string;
  image?: string;
  sections?: DetailSection[];
  error?: string;
  sourceUrl?: string;
  mnfId?: string;
  mdlId?: string;
  rec?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeValue(label: string, value: string) {
  const clean = cleanText(value)
    .replace(/DBA-\s+/g, "DBA-")
    .replace(/\s+door$/i, " дверей");

  if (!clean || clean === "/" || clean === "-" || clean === "—") return "—";
  if (/電子制御燃料噴射装置/.test(clean)) return "Электронный впрыск топлива";
  if (/^No$/i.test(clean)) return "Нет";
  if (/^Yes$/i.test(clean)) return "Да";
  if (/^Exist$/i.test(clean)) return "Есть";
  if (/^Unknown$/i.test(clean)) return "—";
  if (/^FF$/i.test(clean)) return "FF";
  if (/^Manual$/i.test(clean)) return "Ручной";
  if (/^Exist$/i.test(clean)) return "Есть";
  if (/^Unknown$/i.test(clean)) return "—";
  if (/^Power assist equipped rack&pinion$/i.test(clean)) return "Рейка-шестерня с электроусилителем";
  if (/^McPherson Strut type Coil spring$/i.test(clean)) return "МакФерсон, винтовая пружина";
  if (/^disk$/i.test(clean)) return "Дисковые";
  if (/^Drum$/i.test(clean)) return "Барабанные";
  if (/^Kei car$/i.test(clean)) return "Кей-кар";
  if (/water cooling inline 3 cylinder DOHC 12-valves/i.test(clean)) return "Рядный 3-цилиндровый DOHC 12V с жидкостным охлаждением";
  if (/Option settings NO/i.test(clean)) return "Опция, не в базе";

  if (/fuel/i.test(label) && /Regular/i.test(clean)) return clean.replace("Regular", "Регуляр");

  return clean;
}

function ruSection(title: string) {
  const key = cleanText(title).toLowerCase();

  const map: Record<string, string> = {
    description: "Основные характеристики",
    "safe equip set": "Средства безопасности",
    "the design of the body, providing energy absorption and dispersion of strike": "Безопасность кузова",
    "comfort": "Комфорт",
    "interior equip": "Оснащение салона",
    "sunroof": "Дополнительное оборудование",
    "engine": "Двигатель",
    "supercharger": "Топливо и расход",
    "steering and suspension": "Рулевое управление и подвеска",
    "gearbox": "Коробка передач",
    "additional front headlights": "Наружное оборудование",
    "exterior equipment": "Наружное оборудование",
    "navigation": "Навигация, аудио и видео",
    "navigation, audio and video": "Навигация, аудио и видео",
    "gear ratio": "Передаточные числа КПП",
    "original car colours": "Цвета кузова",
  };

  return map[key] || title;
}

function ruLabel(label: string) {
  const key = cleanText(label).toLowerCase();

  const map: Record<string, string> = {
    modification: "Модификация",
    "chassis id": "Кузов",
    "dates releasing": "Дата выпуска",
    "base price, ¥": "Базовая цена, ¥",
    "body size": "Размеры кузова, мм",
    "the size of the passenger compartment (lxwxh), mm": "Размеры салона, мм",
    "wheelbase mm": "Колёсная база, мм",
    "track front / rear wheels, mm": "Колея перед/зад, мм",
    "full weight,kg": "Масса, кг",
    "body type": "Тип кузова",
    "number of doors/seats": "Двери / места",

    "driver's airbag": "Подушка безопасности водителя",
    "front passenger air bag": "Подушка безопасности пассажира",
    "side airbags": "Боковые подушки безопасности",
    abs: "ABS",
    trc: "TRC",
    tsc: "TSC",
    "safety belts with tensioner": "Ремни с преднатяжителями",
    "safety belts with efforts' limiters": "Ремни с ограничителями усилия",
    "safety belts with holding": "Ремни с точечным креплением",
    "the mechanism of fixation of child's seat": "Крепление детского кресла",
    "suspension of safety plugs": "Шторки безопасности",
    "curtains of safety plugs": "Шторки безопасности",
    "other safety equipment": "Другое оборудование безопасности",
    "brake assist": "Brake Assist",
    ebd: "EBD",

    airbag: "Подушка безопасности",
    "air conditioner": "Кондиционер",
    "power window": "Электростеклоподъёмники",
    "electric windows": "Электростеклоподъёмники",
    "central door lock": "Центральный замок",
    "centralized door lock": "Центральный замок",
    "steering column length": "Регулировка руля по вылету",
    "steering column height": "Регулировка руля по высоте",
    "finishing leather steering wheel": "Кожаная отделка руля",
    "remote control key": "Дистанционный ключ",
    seats: "Сиденья",
    "privacy glass": "Тонированные стёкла",

    "alloy wheels": "Литые диски",
    "folding seat": "Складные сиденья",

    model: "Модель двигателя",
    type: "Тип",
    "bore x course of the piston, mm": "Диаметр цилиндра x ход поршня, мм",
    "engine size": "Объём двигателя, см³",
    "compression ratio": "Степень сжатия",
    "fuel injection system": "Система впрыска топлива",
    "maximum power hp / t.min.": "Максимальная мощность, л.с.",
    "maximum torque, nm / rpm": "Максимальный момент, Нм / об/мин",

    "fuel tank capacity, liters": "Объём топливного бака, л",
    fuel: "Топливо",
    "fuel consumption, l/100 km": "Расход топлива, л/100 км",

    steering: "Рулевой механизм",
    "front suspension": "Передняя подвеска",
    "rear suspension": "Задняя подвеска",
    "front brake": "Передние тормоза",
    "rear brake": "Задние тормоза",
    "front wheel": "Передние шины",
    "rear wheel": "Задние шины",
    "the minimum diameter of a turn": "Минимальный радиус разворота",

    "number of steps / type": "Тип КПП",
    drive: "Привод",

    "front fog lights": "Передние противотуманные фары",
    "front fog lamp": "Передние противотуманные фары",
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

function findValue(sections: DetailSection[], labels: string[]) {
  const lowered = labels.map((item) => item.toLowerCase());

  for (const section of sections) {
    for (const row of section.rows) {
      if (lowered.includes(cleanText(row.label).toLowerCase())) {
        return normalizeValue(row.label, row.value);
      }
    }
  }

  return "—";
}

function titleParts(payload: DetailPayload) {
  const raw = cleanText(payload.title || "")
    .replace(/\s*\/\s*BUY NOW\s*$/i, "")
    .replace(/\s*BUY NOW\s*$/i, "");

  const parts = raw
    .split("/")
    .map((item) => cleanText(item))
    .filter(Boolean);

  return {
    brand: parts[0] || "AUTO",
    model: parts[1] || "MODEL",
  };
}

async function loadDetail(mnfId: string, mdlId: string, rec: string): Promise<DetailPayload> {
  const h = await headers();
  const host = h.get("host") || "mosaicauto.ru";
  const proto = h.get("x-forwarded-proto") || "https";

  const url = new URL(`${proto}://${host}/api/catalog/factory/detail`);
  url.searchParams.set("mnf_id", mnfId);
  url.searchParams.set("mdl_id", mdlId);
  url.searchParams.set("rec", rec);

  const res = await fetch(url.toString(), { cache: "no-store" });
  return res.json();
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-base font-black text-white">{value}</div>
    </div>
  );
}

export default async function FactoryDetailPage({
  params,
}: {
  params: Promise<{ mnfId: string; mdlId: string; rec: string }>;
}) {
  const { mnfId, mdlId, rec } = await params;
  const payload = await loadDetail(mnfId, mdlId, rec);

  const rawSections = payload.sections || [];
  const sections = rawSections.map((section) => ({
    ...section,
    title: ruSection(section.title),
    rows: section.rows.map((row) => ({
      label: ruLabel(row.label),
      value: normalizeValue(row.label, row.value),
    })),
  }));
  const parts = titleParts(payload);

  const modification = findValue(rawSections, ["Modification"]);
  const chassis = findValue(rawSections, ["Chassis ID"]);
  const release = findValue(rawSections, ["Dates releasing"]);
  const engine = findValue(rawSections, ["Model"]);
  const engineSize = findValue(rawSections, ["Engine Size"]);
  const gearbox = findValue(rawSections, ["Number of steps / Type"]);
  const drive = findValue(rawSections, ["Drive"]);
  const fuel = findValue(rawSections, ["Fuel"]);
  const consumption = findValue(rawSections, ["Fuel consumption, l/100 km"]);
  const basePrice = findValue(rawSections, ["Base price, ¥"]);

  const heroTitle = [parts.brand, parts.model, modification !== "—" ? modification : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-[#f3f6fa] text-[#07152f]">
      <div className="mx-auto max-w-[1540px] px-4 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <a
            href="javascript:history.back()"
            className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#07152f] shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
          >
            ← Назад к лоту
          </a>

          <Link
            href="/catalog"
            className="rounded-2xl bg-[#07152f] px-5 py-2 text-sm font-black text-white shadow-sm hover:bg-[#d8001f]"
          >
            В каталог
          </Link>
        </div>

        {payload.ok === false ? (
          <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-black text-red-600">Не удалось загрузить модификацию</div>
            <div className="mt-2 text-sm font-bold text-slate-500">
              {payload.error || "Ошибка загрузки данных"}
            </div>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[430px_minmax(0,1fr)]">
                <div className="relative bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6">
                  <div className="absolute left-6 top-6 rounded-full bg-[#ff2d3d]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#d8001f]">
                    заводской каталог
                  </div>

                  <div className="mt-10 flex h-[310px] items-center justify-center rounded-[28px] bg-white p-5 shadow-inner ring-1 ring-slate-200">
                    {payload.image ? (
                      <img
                        src={payload.image}
                        alt={heroTitle}
                        className="max-h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-sm font-bold text-slate-400">Нет фото</div>
                    )}
                  </div>
                </div>

                <div className="bg-[#07152f] p-6 text-white">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff2d3d]">
                    Подробности модификации
                  </div>

                  <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight md:text-5xl">
                    {heroTitle}
                  </h1>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#07152f]">
                      {chassis}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/10">
                      {release}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/10">
                      REC {rec}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SpecCard label="Двигатель" value={`${engine}${engineSize !== "—" ? ` / ${engineSize} см³` : ""}`} />
                    <SpecCard label="КПП" value={gearbox} />
                    <SpecCard label="Привод" value={drive} />
                    <SpecCard label="Цена" value={basePrice} />
                    <SpecCard label="Топливо" value={fuel} />
                    <SpecCard label="Расход" value={consumption !== "—" ? `${consumption} л/100 км` : "—"} />
                    <SpecCard label="Марка" value={parts.brand} />
                    <SpecCard label="Модель" value={parts.model} />
                  </div>

                  <div className="mt-6 rounded-2xl bg-white/8 p-4 text-sm font-bold leading-relaxed text-white/70 ring-1 ring-white/10">
                    Здесь собраны заводские характеристики выбранной модификации: кузов,
                    двигатель, КПП, привод, размеры, расход топлива, подвеска и оснащение.
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid items-start gap-4 xl:grid-cols-2">
              {sections.map((section) => {
                const title = ruSection(section.title);
                const isWide =
                  title === "Цвета кузова" ||
                  title === "Передаточные числа КПП" ||
                  section.rows.some((row) => cleanText(row.value).length > 120);

                return (
                  <div
                    key={section.title}
                    className={`overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm ${
                      isWide ? "xl:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 bg-[#07152f] px-5 py-3">
                      <div className="text-base font-black text-white">{title}</div>
                      <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/60">
                        {section.rows.length}
                      </div>
                    </div>

                    <div className={isWide ? "grid gap-0 md:grid-cols-2" : "divide-y divide-slate-100"}>
                      {section.rows.map((row) => (
                        <div
                          key={`${section.title}-${row.label}-${row.value}`}
                          className={`gap-3 px-5 py-3 text-sm ${
                            isWide
                              ? "border-b border-r border-slate-100 last:border-r-0"
                              : "grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]"
                          }`}
                        >
                          <div className="font-bold text-slate-500">
                            {ruLabel(row.label)}
                          </div>
                          <div className="mt-1 break-words font-black text-slate-950 sm:mt-0">
                            {normalizeValue(row.label, row.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
