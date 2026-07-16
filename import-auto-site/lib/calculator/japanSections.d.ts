export type MonetaryRows = {
  tag1: number[];
  tag2: number[];
  tag3: number[];
};

export type AggregatedSourceRow = {
  label: string;
  sourceValue: number;
  sourceCurrency: "JPY" | "RUB";
};

export function sumValues(values: number[]): number;

export function buildAggregatedSourceRows(monetaryRows: MonetaryRows): {
  japan: AggregatedSourceRow[];
  russia: AggregatedSourceRow[];
};
