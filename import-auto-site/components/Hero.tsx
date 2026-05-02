export default function Hero() {
  return (
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
            Подберём автомобиль за рубежом, проверим поставщика и состояние,
            рассчитаем финальную стоимость, организуем покупку, доставку и
            оформление в России.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#auth"
              className="rounded-2xl bg-red-600 px-6 py-4 text-center font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Зарегистрироваться
            </a>
            <a
              href="#markets"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-900 shadow-sm transition hover:border-red-200 hover:text-red-600"
            >
              Смотреть направления
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-2xl shadow-slate-200">
            <div className="flex h-[360px] w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-100 to-slate-300 md:h-[520px]">
              <div className="text-center">
                <div className="text-8xl">🚗</div>
                <div className="mt-4 text-2xl font-bold text-slate-800">
                  Единая платформа импорта
                </div>
                <div className="mt-2 text-slate-500">
                  Япония · Китай · Корея · другие страны
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 p-5 shadow-xl backdrop-blur">
            <div className="text-sm text-slate-500">Доступ к каталогу</div>
            <div className="mt-1 text-2xl font-bold">только после входа</div>
            <div className="mt-2 font-semibold text-red-600">
              регистрация защищает данные и заявки
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}