"use client";

import type { ComponentProps } from "react";
import OriginalLotCalculatorPanel from "./LotCalculatorPanel";

type Props = ComponentProps<typeof OriginalLotCalculatorPanel>;

/**
 * Нейтральное представление калькулятора лота.
 *
 * Расчёт и обе итоговые карточки остаются без изменений, но интерфейс
 * не рекомендует физическое или юридическое лицо и не выделяет более
 * дешёвый вариант как «выгоднее».
 */
export default function LotCalculatorPanelNeutral(props: Props) {
  return (
    <div className="lot-calculator-neutral">
      <OriginalLotCalculatorPanel {...props} />

      <style>{`
        .lot-calculator-neutral .mt-1.text-sm.font-black.text-green-700 {
          display: none !important;
        }

        .lot-calculator-neutral span[class*="rounded-full"][class*="bg-[#ff2d3d]"] {
          display: none !important;
        }

        .lot-calculator-neutral [class*="shadow-[0_0_0_2px_rgba(255,45,61,0.10)]"] {
          border-color: rgb(226 232 240) !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
