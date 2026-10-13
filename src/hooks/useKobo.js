/**
 * Money helpers — the API stores all amounts as whole kobo (integers).
 * These helpers convert for display and back for submission.
 */

/** Convert kobo integer to naira string: 4500000 → "₦45,000.00" */
export function koboToNaira(kobo, options = {}) {
  if (kobo == null || isNaN(kobo)) return '—';
  const { currency = 'NGN', compact = false } = options;
  const naira = kobo / 100;

  if (compact) {
    if (naira >= 1_000_000_000) return `₦${(naira / 1_000_000_000).toFixed(1)}B`;
    if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
    if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(naira);
}

/** Convert naira float input to whole kobo integer: 45000.50 → 4500050 */
export function nairaToKobo(naira) {
  if (naira == null || naira === '') return 0;
  return Math.round(parseFloat(naira) * 100);
}

/**
 * React hook wrapper — lets components call:
 *   const { koboToNaira, nairaToKobo } = useKobo();
 */
export function useKobo() {
  return { koboToNaira, nairaToKobo };
}
