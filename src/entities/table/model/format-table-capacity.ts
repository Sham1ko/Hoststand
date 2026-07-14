export function formatTableCapacity(capacity: number) {
  const lastTwoDigits = capacity % 100;
  const lastDigit = capacity % 10;

  if (lastDigit === 1 && lastTwoDigits !== 11) return `${capacity} место`;
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${capacity} места`;
  }

  return `${capacity} мест`;
}
