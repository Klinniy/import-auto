type Market = "japan" | "china";

type CalcInput = {
  price?: number;
  priceJpy?: number;
  aucPrice?: number;
  auctionPrice?: number;
  cost?: number;
  year?: number;
  volume?: number;
  engineVolume?: number;
  engine?: number;
  power?: number;
  hp?: number;
  electricPower?: number;
  electroPower?: number;
  fuel?: string;
  fuelCode?: string;
  fuelType?: string;
  youngerThree?: boolean;
  underThreeYears?: boolean;
  isProhChecked?: boolean;
  dvs30?: boolean;
  powerDvsMax30MinEd?: boolean;
};

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function fmt(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} ₽`;
}

function getFuel(body: CalcInput) {
  return String(body.fuelType || body.fuelCode || body.fuel || "").toLowerCase();
}

function estimateDutyRub(params: {
  carRub: number;
  volume: number;
  power: number;
  age: number;
  fuel: string;
  isPhysical: boolean;
}) {
  const { carRub, volume, power, age, fuel, isPhysical } = params;

  const isElectro = fuel.includes("electro") || fuel.includes("электро") || fuel === "electric";

  if (isElectro) {
    return isPhysical ? Math.max(carRub * 0.15, power * 900) : Math.max(carRub * 0.18, power * 1200);
  }

  const ageCoef = age < 3 ? 1.15 : age <= 5 ? 1.35 : 1.6;
  const volumeCoef = volume <= 1000 ? 80 : volume <= 1500 ? 110 : volume <= 1800 ? 140 : volume <= 2300 ? 190 : volume <= 3000 ? 260 : 340;

  const physicalDuty = Math.max(carRub * 0.18, volume * volumeCoef * ageCoef);
  const juridicalDuty = Math.max(carRub * 0.22, volume * volumeCoef * ageCoef * 1.15);

  return isPhysical ? physicalDuty : juridicalDuty;
}

function makeText(title: string, lines: { label: string; value: number }[], total: number) {
  return [
    title,
    ...lines.map((line) => `${line.label}: ${fmt(line.value)}`),
    `Итого: ${fmt(total)}`,
  ].join("\n");
}

export function calculateImport(market: Market, body: CalcInput) {
  const currentYear = new Date().getFullYear();

  const rates = {
    jpy: 0.48056,
    cny: 11.3359,
    usd: 88,
    eur: 95,
  };

  const year = Math.round(num(body.year, currentYear));
  const age = Math.max(0, currentYear - year);

  const volume = Math.round(num(body.volume || body.engineVolume || body.engine, 0));
  const power = Math.round(num(body.power || body.hp || body.electricPower || body.electroPower, 0));
  const fuel = getFuel(body);

  const youngerThree = bool(body.youngerThree) || bool(body.underThreeYears) || bool(body.isProhChecked) || age < 3;

  const rawPrice = num(body.price || body.cost, 0);

  const foreignPrice =
    market === "japan"
      ? Math.round(num(body.priceJpy || body.aucPrice || body.auctionPrice, rawPrice * 1000))
      : Math.round(rawPrice);

  const rate = market === "japan" ? rates.jpy : rates.cny;
  const carRub = foreignPrice * rate;

  const deliveryRub = market === "japan" ? 180000 : 260000;
  const brokerRub = 85000;
  const docsRub = 45000;
  const labRub = 60000;
  const utilPhysicalRub = youngerThree ? 5200 : 3400;
  const utilJuridicalRub = youngerThree ? 300000 : 520000;

  function side(isPhysical: boolean) {
    const dutyRub = estimateDutyRub({
      carRub,
      volume,
      power,
      age,
      fuel,
      isPhysical,
    });

    const utilRub = isPhysical ? utilPhysicalRub : utilJuridicalRub;

    const lines = [
      { label: market === "japan" ? "Стоимость авто на аукционе" : "Стоимость авто в Китае", value: carRub },
      { label: "Доставка и логистика", value: deliveryRub },
      { label: "Таможенные платежи", value: dutyRub },
      { label: "Утильсбор", value: utilRub },
      { label: "Оформление и документы", value: brokerRub + docsRub + labRub },
    ];

    const totalRub = lines.reduce((sum, line) => sum + line.value, 0);
    const title = isPhysical ? "Физическое лицо" : "Юридическое лицо";

    return {
      title,
      totalRub: Math.round(totalRub),
      totalUsd: Math.round(totalRub / rates.usd),
      dutyUsd: Math.round(totalRub / rates.usd),
      cityRub: fmt(totalRub),
      text: makeText(title, lines, totalRub),
      lines: lines.map((line) => ({
        ...line,
        value: Math.round(line.value),
        formatted: fmt(line.value),
      })),
    };
  }

  const physical = side(true);
  const juridical = side(false);

  return {
    ok: true,
    market,
    rates,
    input: {
      year,
      age,
      volume,
      power,
      fuel,
      youngerThree,
      foreignPrice,
      rate,
    },
    physical,
    juridical,
    text: `${physical.text}\n\n${juridical.text}`,
    note: "Ориентировочный расчёт. Итоговая стоимость зависит от курса, логистики, таможенных платежей и параметров конкретного автомобиля.",
  };
}
