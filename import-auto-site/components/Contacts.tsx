function Field({ placeholder }: { placeholder: string }) {
  return (
    <input
      className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-red-500"
      placeholder={placeholder}
    />
  );
}

export default function Contacts() {
  return (
    <section id="contacts" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="rounded-[2rem] bg-slate-50 p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Подберём автомобиль под ваш бюджет
            </h2>
            <p className="mt-4 text-slate-600">
              Оставьте контакты, страну покупки, желаемую модель и бюджет. Мы
              подготовим первые варианты и расчёт стоимости.
            </p>
            <div className="mt-8 text-slate-700">
              Telegram / WhatsApp / звонок
            </div>
          </div>

          <form className="grid gap-4">
            <Field placeholder="Ваше имя" />
            <Field placeholder="Телефон или Telegram" />
            <Field placeholder="Страна: Япония / Китай / Корея / другое" />
            <Field placeholder="Модель / бюджет" />
            <button
              type="button"
              className="rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700"
            >
              Отправить заявку
            </button>
            <p className="text-xs leading-5 text-slate-500">
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
              Для РФ обязательно добавим страницу политики конфиденциальности.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}