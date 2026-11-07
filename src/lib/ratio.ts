/** 1.5 -> "3 for every 2", 2.5 -> "5 for every 2", 3 -> "3 for every 1". Lowest terms, denominator up to 100. */
export function formatRatio(multiplier: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  for (let d = 1; d <= 100; d++) {
    const n = multiplier * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      const g = gcd(Math.round(n), d);
      return `${Math.round(n) / g} for every ${d / g}`;
    }
  }
  return `${multiplier} for every 1`;
}
