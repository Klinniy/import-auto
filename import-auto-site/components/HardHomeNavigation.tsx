"use client";

import { useEffect } from "react";

function isHomeHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);

    return (
      url.origin === window.location.origin &&
      url.pathname === "/" &&
      !url.hash
    );
  } catch {
    return href === "/";
  }
}

export default function HardHomeNavigation() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) return;

      const link = target.closest("a") as HTMLAnchorElement | null;

      if (!link) return;
      if (!link.href) return;
      if (!isHomeHref(link.href)) return;

      // Если уже на главной — ничего не трогаем.
      if (window.location.pathname === "/") return;

      // Для перехода на главную делаем полную загрузку страницы.
      // Это сбрасывает состояние разделов Япония/Китай/Корея и старый prefetch/cache.
      event.preventDefault();
      event.stopPropagation();

      window.location.assign("/");
    }

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
