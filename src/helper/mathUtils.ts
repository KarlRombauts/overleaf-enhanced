export function baseLog(base: number, x: number) {
  return Math.log(x) / Math.log(base);
}

export function roundFloat(number: number, decimalPlaces = 2) {
  const powTen = Math.pow(10, decimalPlaces);
  return Math.round(number * powTen) / powTen;
}

export function withinTolerance(
  number: number,
  target: number,
  percent: number,
) {
  const min = target * (1 - percent);
  const max = target * (1 + percent);
  return number >= min && number <= max;
}
