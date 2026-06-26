const services = [
  ["🛡️", "Проверенные аукционы", "только надёжные площадки"],
  ["📊", "Актуальная статистика", "реальные данные онлайн"],
  ["📷", "Фото и листы", "оригинальные фото и аукционные листы"],
  ["🧮", "Честный расчёт", "без скрытых платежей"],
  ["🚚", "Доставка и таможня", "сопровождение на всех этапах"],
];

export default function Services() {
  return (
    <section id="services" className="relative z-20 -mt-12">
      <div className="mosaic-shell">
        <div className="mosaic-card grid gap-4 rounded-[2rem] p-6 md:grid-cols-5">
          {services.map(([icon, title, text]) => (
            <div key={title} className="flex gap-4 rounded-3xl p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl">
                {icon}
              </div>
              <div>
                <div className="font-black text-[#07152f]">{title}</div>
                <div className="mt-1 text-sm leading-5 text-slate-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
