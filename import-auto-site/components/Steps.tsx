const steps = [
  ["01", "Выбор авто", "Находим лот в каталоге или подбираем варианты под бюджет."],
  ["02", "Проверка", "Смотрим историю, состояние, фото, аукционный лист и риски."],
  ["03", "Расчет", "Считаем стоимость под ключ с доставкой и оформлением."],
  ["04", "Покупка", "Организуем выкуп автомобиля и контроль документов."],
  ["05", "Доставка", "Везем автомобиль, сопровождаем таможню и выдачу клиенту."],
];

export default function Steps() {
  return (
    <section id="steps" className="bg-[#08090d] px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-sm font-black uppercase tracking-[0.24em] text-red-300">процесс</div>
        <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">Как проходит покупка</h2>

        <div className="mt-10 grid gap-4">
          {steps.map(([num, title, text]) => (
            <div key={num} className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:grid-cols-[110px_260px_1fr] md:items-center">
              <div className="text-5xl font-black text-red-500">{num}</div>
              <div className="text-2xl font-black">{title}</div>
              <div className="text-white/55">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
