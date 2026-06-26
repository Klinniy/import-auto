"use client";

import { useState } from "react";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="glass w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-black">
              {mode === "login" ? "Вход в кабинет" : "Регистрация"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Сохраняйте лоты, получайте расчеты и отправляйте заявки менеджеру.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-xl">
            ×
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-white/10 p-1">
          <button
            onClick={() => setMode("login")}
            className={`rounded-xl py-3 text-sm font-bold ${mode === "login" ? "bg-white text-black" : "text-white/60"}`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-xl py-3 text-sm font-bold ${mode === "register" ? "bg-white text-black" : "text-white/60"}`}
          >
            Регистрация
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {mode === "register" && <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none" placeholder="Ваше имя" />}
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none" placeholder="Телефон или email" />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none" placeholder="Пароль" type="password" />
          <button className="rounded-2xl bg-red-600 px-5 py-4 font-black text-white transition hover:bg-red-700">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}
