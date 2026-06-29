"use client";

type DualProps = {
  label: string;
  fromLabel?: string;
  toLabel?: string;
  min: number;
  max: number;
  step?: number;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
  unit?: string;
};

type SingleProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
};

function toNumber(value: string, fallback: number) {
  const parsed = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatValue(value: number, unit?: string) {
  const formatted = new Intl.NumberFormat("ru-RU").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isEmptyMax(value: string, min: number) {
  if (!value) return true;

  const parsed = toNumber(value, min);
  return parsed <= min;
}

export function MosaicDualRange({
  label,
  fromLabel = "от",
  toLabel = "до",
  min,
  max,
  step = 1,
  from,
  to,
  onFrom,
  onTo,
  unit,
}: DualProps) {
  const rawLeft = clamp(toNumber(from, min), min, max);
  const rawRight = clamp(isEmptyMax(to, min) ? max : toNumber(to, max), min, max);

  const left = Math.min(rawLeft, rawRight);
  const right = Math.max(rawLeft, rawRight);

  const leftPercent = ((left - min) / (max - min)) * 100;
  const rightPercent = ((right - min) / (max - min)) * 100;

  return (
    <div className="rounded-lg border border-[#dfe6ef] bg-white px-2.5 py-2 shadow-[0_6px_18px_rgba(7,21,47,0.08)]">
      <div className="mb-1.5">
        <div className="whitespace-nowrap text-[11px] font-black uppercase leading-none tracking-[0.08em] text-[#07152f]">
          {label}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] font-black leading-none">
          <span className="whitespace-nowrap text-[#7f91aa]">
            {fromLabel} <span className="text-[#16834f]">{formatValue(left, unit)}</span>
          </span>

          <span className="whitespace-nowrap text-[#7f91aa]">
            {toLabel} <span className="text-[#16834f]">{formatValue(right, unit)}</span>
          </span>
        </div>
      </div>

      <div className="relative h-5">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#e9eef5]" />

        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#ff2b3f]"
          style={{
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={left}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), right);
            onFrom(next <= min ? "" : String(next));
          }}
          className="mosaic-range absolute inset-x-0 top-0 z-20 h-5 w-full appearance-none bg-transparent"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={right}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), left);
            onTo(next >= max ? "" : String(next));
          }}
          className="mosaic-range absolute inset-x-0 top-0 z-30 h-5 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

export function MosaicSingleRange({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit,
}: SingleProps) {
  const current = clamp(toNumber(value, max), min, max);
  const percent = ((current - min) / (max - min)) * 100;

  return (
    <div className="rounded-lg border border-[#dfe6ef] bg-white px-2.5 py-2 shadow-[0_6px_18px_rgba(7,21,47,0.08)]">
      <div className="mb-1.5">
        <div className="whitespace-nowrap text-[11px] font-black uppercase leading-none tracking-[0.08em] text-[#07152f]">
          {label}
        </div>

        <div className="mt-1 text-right text-[11px] font-black leading-none">
          <span className="whitespace-nowrap text-[#7f91aa]">
            до <span className="text-[#16834f]">{formatValue(current, unit)}</span>
          </span>
        </div>
      </div>

      <div className="relative h-5">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#e9eef5]" />

        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#ff2b3f]"
          style={{ width: `${percent}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange(next >= max ? "" : String(next));
          }}
          className="mosaic-range absolute inset-x-0 top-0 z-30 h-5 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}
