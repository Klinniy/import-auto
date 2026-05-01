"use client";
import React, { useMemo, useState } from "react";

const markets = [
  {
    id: "japan",
    title: "Япония",
    subtitle: "Аукционы USS, TAA, CAA и другие",
    tag: "Аукционы",
    icon: "🇯🇵",
    description: "Правый руль, большой выбор гибридов, минивэнов и надёжных городских авто.",
  },
  {
    id: "china",
    title: "Китай",
    subtitle: "Новые и б/у автомобили, электромобили",
    tag: "Новые авто",
    icon: "🇨🇳",
    description: "Электромобили, гибриды, кроссоверы и новые модели китайского рынка.",
  },
  {
    id: "korea",
    title: "Корея",
    subtitle: "Авторынок Кореи и дилерские площадки",
    tag: "Площадки",
    icon: "🇰🇷",
    description: "Левый руль, понятная история обслуживания и широкий выбор седанов/кроссоверов.",
  },
  {
    id: "other",
    title: "Другие страны",
    subtitle: "Подбор под задачу клиента",
    tag: "Индивидуально",
    icon: "🌍",
    description: "Подключаем дополнительные направления при наличии надёжного поставщика и логистики.",
  },
];

const cars = [
  {
    id: 1,
    country: "Япония",
    brand: "Toyota",
    model: "Harrier",
    year: 2021,
    mileage: 42000,
    engine: "2.0",
    drive: "2WD",
    grade: "4.5",
    source: "USS Tokyo",
    lot: "3045",
    foreignPrice: "¥2 150 000",
    totalPrice: 2850000,
  },
  {
    id: 2,
    country: "Китай",
    brand: "Zeekr",
    model: "001",
    year: 2024,
    mileage: 9000,
    engine: "EV",
    drive: "4WD",
    grade: "Проверка",
    source: "China dealer",
    lot: "CN-8812",
    foreignPrice: "¥269 000",
    totalPrice: 4750000,
  },
  {
    id: 3,
    country: "Корея",
    brand: "Hyundai",
    model: "Palisade",
    year: 2022,
    mileage: 38000,
    engine: "2.2 Diesel",
    drive: "4WD",
    grade: "Без ДТП",
    source: "Korea market",
    lot: "KR-1120",
    foreignPrice: "₩42 000 000",
    totalPrice: 3950000,
  },
];

function rub(value) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function Field({ placeholder, type = "text" }) {
  return <input type={type} className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition focus:border-red-500" placeholder={placeholder} />;
}

export default function ImportAutoPlatformMvp() {
  const [selectedCountry, setSelectedCountry] = useState("Все");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [budget, setBudget] = useState("3000000");

  const countries = useMemo(() => ["Все", ...new Set(cars.map((car) => car.country))], []);
  const filteredCars = selectedCountry === "Все" ? cars : cars.filter((car) => car.country === selectedCountry);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 font-bold text-white">IA</div>
            <div>
              <div className="text-lg font-bold tracking-tight">Import Auto</div>
              <div className="text-xs text-slate-500">авто из Японии, Китая, Кореи и других стран</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#markets" className="hover:text-red-600">Направления</a>
            <a href="#catalog" className="hover:text-red-600">Каталог</a>
            <a href="#steps" className="hover:text-red-600">Как купить</a>
            <a href="#contacts" className="hover:text-red-600">Контакты</a>
          </nav>

          <button onClick={() => setIsLoggedIn(!isLoggedIn)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600">
            {isLoggedIn ? "Выйти" : "Войти"}
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm">
                Импорт автомобилей под ключ
              </div>
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                Автомобили из Японии, Китая и Кореи
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Подберём автомобиль за рубежом, проверим поставщика и состояние, рассчитаем финальную стоимость, организуем покупку, доставку и оформление в России.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#auth" className="rounded-2xl bg-red-600 px-6 py-4 text-center font-semibold text-white shadow-sm transition hover:bg-red-700">
                  Зарегистрироваться
                </a>
                <a href="#markets" className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-900 shadow-sm transition hover:border-red-200 hover:text-red-600">
                  Смотреть направления
                </a>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-slate-600">
                <div><b className="block text-xl text-slate-950">4</b> направления</div>
                <div><b className="block text-xl text-slate-950">ЛК</b> для клиентов</div>
                <div><b className="block text-xl text-slate-950">API</b> каталогов</div>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-2xl shadow-slate-200">
                <div className="flex h-[360px] w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-100 to-slate-300 md:h-[520px]">
                  <div className="text-center">
                    <div className="text-8xl">🚗</div>
                    <div className="mt-4 text-2xl font-bold text-slate-800">Единая платформа импорта</div>
                    <div className="mt-2 text-slate-500">Япония · Китай · Корея · другие страны</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 p-5 shadow-xl backdrop-blur">
                <div className="text-sm text-slate-500">Доступ к каталогу</div>
                <div className="mt-1 text-2xl font-bold">только после входа</div>
                <div className="mt-2 font-semibold text-red-600">регистрация защищает данные и заявки</div>
              </div>
            </div>
          </div>
        </section>

        <section id="markets" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Направления импорта</h2>
              <p className="mt-3 max-w-2xl text-slate-600">Разделяем рынки, потому что у каждого направления разные источники данных, валюта, логистика, сроки и правила оформления.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {markets.map((market) => (
              <div key={market.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{market.icon}</div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">{market.tag}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{market.title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{market.subtitle}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{market.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="auth" className="bg-slate-950 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Личный кабинет клиента</h2>
              <p className="mt-4 max-w-xl text-slate-300">Каталог, расширенные лоты, расчёты, избранное и заявки доступны только после регистрации или входа.</p>
              <div className="mt-8 grid gap-4 text-slate-200">
                <div>✅ защита коммерческих данных и источников</div>
                <div>✅ история заявок и подобранных автомобилей</div>
                <div>✅ сохранённые лоты и сравнение авто</div>
                <div>✅ персональный расчёт по стране и бюджету</div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button onClick={() => setAuthMode("login")} className={`rounded-xl px-4 py-3 text-sm font-bold ${authMode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}>Вход</button>
                <button onClick={() => setAuthMode("register")} className={`rounded-xl px-4 py-3 text-sm font-bold ${authMode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}>Регистрация</button>
              </div>
              <div className="grid gap-4">
                {authMode === "register" && <Field placeholder="Имя" />}
                <Field placeholder="Телефон или email" />
                <Field placeholder="Пароль" type="password" />
                {authMode === "register" && <Field placeholder="Город" />}
                <button type="button" onClick={() => setIsLoggedIn(true)} className="rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700">
                  {authMode === "login" ? "Войти и открыть каталог" : "Создать аккаунт"}
                </button>
                <p className="text-xs leading-5 text-slate-500">Для российского сайта добавим согласие на обработку персональных данных и политику конфиденциальности.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="catalog" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Каталог автомобилей</h2>
                <p className="mt-3 max-w-2xl text-slate-600">Боевой каталог будет подтягивать данные из разных источников по странам. На макете показана логика разделения.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {countries.map((country) => (
                  <button key={country} onClick={() => setSelectedCountry(country)} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${selectedCountry === country ? "bg-red-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                    {country}
                  </button>
                ))}
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <div className="text-6xl">🔒</div>
                <h3 className="mt-5 text-2xl font-bold">Каталог доступен после входа</h3>
                <p className="mx-auto mt-3 max-w-xl text-slate-600">Зарегистрируйтесь, чтобы смотреть автомобили из Японии, Китая, Кореи, сохранять лоты и отправлять заявки на расчёт.</p>
                <a href="#auth" className="mt-6 inline-flex rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-700">Войти или зарегистрироваться</a>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {filteredCars.map((car) => (
                  <article key={car.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
                      <div className="text-center">
                        <div className="text-6xl">🚘</div>
                        <div className="mt-2 text-sm font-semibold text-slate-600">{car.country} · {car.brand} {car.model}</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">{car.brand} {car.model}</h3>
                          <p className="mt-1 text-sm text-slate-500">{car.source} · {car.lot}</p>
                        </div>
                        <span className="rounded-xl bg-red-50 px-3 py-1 text-sm font-bold text-red-600">{car.country}</span>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <div>Год: <b className="text-slate-950">{car.year}</b></div>
                        <div>Пробег: <b className="text-slate-950">{new Intl.NumberFormat("ru-RU").format(car.mileage)} км</b></div>
                        <div>Двигатель: <b className="text-slate-950">{car.engine}</b></div>
                        <div>Привод: <b className="text-slate-950">{car.drive}</b></div>
                      </div>
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="text-sm text-slate-500">Цена в стране покупки</div>
                        <div className="font-bold">{car.foreignPrice}</div>
                        <div className="mt-3 text-sm text-slate-500">Ориентир под ключ</div>
                        <div className="text-2xl font-bold text-red-600">{rub(car.totalPrice)}</div>
                      </div>
                      <a href="#contacts" className="mt-5 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-red-600">Запросить расчёт</a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="steps" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Как проходит покупка</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            {["Регистрация", "Выбор страны", "Подбор авто", "Проверка и расчёт", "Покупка и доставка"].map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-200 p-6">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold text-white">{index + 1}</div>
                <h3 className="font-bold">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {index === 0 ? "Клиент создаёт аккаунт" : index === 1 ? "Выбирает Японию, Китай, Корею или другое направление" : index === 2 ? "Смотрит каталог или оставляет заявку" : index === 3 ? "Получает расчёт и проверку лота" : "Мы организуем сделку, логистику и оформление"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="calc" className="bg-slate-950 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Расчёт по стране импорта</h2>
              <p className="mt-4 max-w-xl text-slate-300">Для каждой страны будет отдельная формула: валюта, логистика, пошлины, сборы, комиссия и сроки.</p>
              <div className="mt-8 space-y-4 text-slate-200">
                <div>✅ Япония: аукционная цена + расходы + таможня</div>
                <div>✅ Китай: цена поставщика + экспорт + логистика + оформление</div>
                <div>✅ Корея: площадка/дилер + проверка + доставка + таможня</div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
              <label className="text-sm font-semibold text-slate-700">Ваш бюджет, ₽</label>
              <input value={budget} onChange={(event) => setBudget(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg outline-none focus:border-red-500" />
              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <div className="text-sm text-slate-500">Статус функции</div>
                <div className="mt-1 text-2xl font-bold">доступно после входа</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">В боевой версии расчёт будет персональным и сохранится в личном кабинете клиента.</p>
              </div>
              <a href="#auth" className="mt-5 flex w-full items-center justify-center rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700">Войти для расчёта</a>
            </div>
          </div>
        </section>

        <section id="contacts" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="rounded-[2rem] bg-slate-50 p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Подберём автомобиль под ваш бюджет</h2>
                <p className="mt-4 text-slate-600">Оставьте контакты, страну покупки, желаемую модель и бюджет. Мы подготовим первые варианты и расчёт стоимости.</p>
                <div className="mt-8 text-slate-700">Telegram / WhatsApp / звонок</div>
              </div>
              <form className="grid gap-4">
                <Field placeholder="Ваше имя" />
                <Field placeholder="Телефон или Telegram" />
                <Field placeholder="Страна: Япония / Китай / Корея / другое" />
                <Field placeholder="Модель / бюджет" />
                <button type="button" className="rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700">Отправить заявку</button>
                <p className="text-xs leading-5 text-slate-500">Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Для РФ обязательно добавим страницу политики конфиденциальности.</p>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}