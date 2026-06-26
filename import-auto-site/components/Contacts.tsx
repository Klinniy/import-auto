import Image from "next/image";

function Field({ placeholder }: { placeholder: string }) {
  return (
    <input
      className="h-14 rounded-2xl border border-slate-200 bg-white px-5 font-semibold text-[#07152f] outline-none placeholder:text-slate-400 focus:border-blue-400"
      placeholder={placeholder}
    />
  );
}

export default function Contacts() {
  return (
    <section id="contacts" className="py-20">
      <div className="mosaic-shell">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-slate-300/60">
          <Image
            src="/mosaic/contacts-bg.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/50" />

          <div className="relative z-10 grid gap-10 p-8 md:p-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-[#ff2d3d]">
                Контакты
              </div>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#07152f] md:text-5xl">
                Подберём автомобиль под ваш бюджет
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Оставьте контакты, страну покупки, желаемую модель и бюджет.
                Мы подготовим первые варианты и расчёт стоимости.
              </p>
            </div>

            <form className="mosaic-card grid gap-4 rounded-[2rem] p-6">
              <Field placeholder="Ваше имя" />
              <Field placeholder="Телефон или Telegram" />
              <Field placeholder="Страна: Япония / Корея / Китай" />
              <Field placeholder="Модель / бюджет" />
              <button
                type="button"
                className="rounded-2xl bg-[#ff2d3d] px-6 py-4 font-black text-white transition hover:bg-[#e51d2d]"
              >
                Отправить заявку
              </button>
              <p className="text-xs leading-5 text-slate-500">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
              </p>
            </form>
          </div>
        </div>

        <footer className="py-10 text-center text-sm font-semibold text-slate-500">
          MosaicAuto © 2026 · Автомобили из Японии под ключ
        </footer>
      </div>
    </section>
  );
}
