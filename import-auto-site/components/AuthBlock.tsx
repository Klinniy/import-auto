"use client";

import { useState } from "react";

type AuthBlockProps = {
  setIsLoggedIn: (value: boolean) => void;
};

function Field({ placeholder, type = "text" }: { placeholder: string; type?: string }) {
  return (
    <input
      type={type}
      className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition focus:border-red-500"
      placeholder={placeholder}
    />
  );
}

export default function AuthBlock({ setIsLoggedIn }: AuthBlockProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  return (
    <section id="auth" className="bg-slate-950 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Личный кабинет клиента
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Каталог, расширенные лоты, расчёты, избранное и заявки доступны
            только после регистрации или входа.
          </p>

          <div className="mt-8 grid gap-4 text-slate-200">
            <div>✅ защита коммерческих данных и источников</div>
            <div>✅ история заявок и подобранных автомобилей</div>
            <div>✅ сохранённые лоты и сравнение авто</div>
            <div>✅ персональный расчёт по стране и бюджету</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setAuthMode("login")}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${
                authMode === "login" ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${
                authMode === "register" ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              Регистрация
            </button>
          </div>

          <div className="grid gap-4">
            {authMode === "register" && <Field placeholder="Имя" />}
            <Field placeholder="Телефон или email" />
            <Field placeholder="Пароль" type="password" />
            {authMode === "register" && <Field placeholder="Город" />}

            <button
              type="button"
              onClick={() => setIsLoggedIn(true)}
              className="rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700"
            >
              {authMode === "login" ? "Войти и открыть каталог" : "Создать аккаунт"}
            </button>

            <p className="text-xs leading-5 text-slate-500">
              Для российского сайта добавим согласие на обработку персональных
              данных и политику конфиденциальности.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}