type HeaderProps = {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
};

export default function Header({ isLoggedIn, setIsLoggedIn }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 font-bold text-white">
            IA
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Import Auto</div>
            <div className="text-xs text-slate-500">
              авто из Японии, Китая, Кореи и других стран
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
          <a href="#markets" className="hover:text-red-600">Направления</a>
          <a href="#catalog" className="hover:text-red-600">Каталог</a>
          <a href="#steps" className="hover:text-red-600">Как купить</a>
          <a href="#contacts" className="hover:text-red-600">Контакты</a>
        </nav>

        <button
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          {isLoggedIn ? "Выйти" : "Войти"}
        </button>
      </div>
    </header>
  );
}