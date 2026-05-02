const steps = [
  {
    title: "Регистрация",
    text: "Клиент создаёт аккаунт",
  },
  {
    title: "Выбор страны",
    text: "Выбирает Японию, Китай, Корею или другое направление",
  },
  {
    title: "Подбор авто",
    text: "Смотрит каталог или оставляет заявку",
  },
  {
    title: "Проверка и расчёт",
    text: "Получает расчёт и проверку лота",
  },
  {
    title: "Покупка и доставка",
    text: "Мы организуем сделку, логистику и оформление",
  },
];

export default function Steps() {
  return (
    <section id="steps" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
        Как проходит покупка
      </h2>

      <div className="mt-8 grid gap-5 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-3xl border border-slate-200 p-6">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold text-white">
              {index + 1}
            </div>
            <h3 className="font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}