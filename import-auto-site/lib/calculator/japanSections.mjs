export function sumValues(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
}

export function buildAggregatedSourceRows(monetaryRows) {
  const tag1 = Array.isArray(monetaryRows?.tag1)
    ? monetaryRows.tag1.map(Number).filter(Number.isFinite)
    : [];
  const tag3 = Array.isArray(monetaryRows?.tag3)
    ? monetaryRows.tag3.map(Number).filter(Number.isFinite)
    : [];

  const japan = [];
  const russia = [];

  if (tag1.length) {
    japan.push({
      label: "Стоимость автомобиля",
      sourceValue: tag1[0],
      sourceCurrency: "JPY",
    });

    const extraJapan = sumValues(tag1.slice(1));
    if (extraJapan) {
      japan.push({
        label: "Прочие расходы поставщика в Японии",
        sourceValue: extraJapan,
        sourceCurrency: "JPY",
      });
    }
  }

  const extraRussia = sumValues(tag3);
  if (extraRussia) {
    russia.push({
      label: "Прочие расходы поставщика в России",
      sourceValue: extraRussia,
      sourceCurrency: "RUB",
    });
  }

  return { japan, russia };
}
